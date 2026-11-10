# LocalNewz — Copy Link Mobile Preview Investigation

**Status:** Investigation complete. Implementation-ready plan.

---

## Summary of Findings

### Desktop vs Mobile Copy Link — Same Component, Same Function

There is **no separate mobile Copy Link component**. Both desktop and mobile use the same `ArticalDetails.tsx` component with responsive CSS.

| Implementation | File | Function | URL Source |
|---------------|------|----------|------------|
| Article Copy Link (desktop + mobile) | `client/src/components/User/ArticalDetails/ArticalDetails.tsx:741-745` | `handleShare("copy")` → `getShareUrl(slug)` | `getFrontendBaseUrl()` |
| Live News Copy Link (desktop + mobile) | `client/src/components/User/LiveDetails/LiveDetails.tsx:345-348` | `handleShare("copy")` → inline URL | `getFrontendBaseUrl()` |
| Comment Copy Link (desktop + mobile) | `client/src/components/User/ArticalDetails/ArticalDetails.tsx:941-952` | `handleCopyLink(commentId)` → `window.location.origin + pathname` | `window.location.origin` |

### URL Generation Logic

**`getShareUrl(slug)`** — `client/src/utils/share.ts:17-19`:
```ts
export function getShareUrl(slug: string): string {
  return `${getFrontendBaseUrl()}/news/${encodeURIComponent(slug)}`;
}
```

**`getFrontendBaseUrl()`** — `client/src/utils/share.ts:6-13`:
```ts
export function getFrontendBaseUrl(): string {
  const configured = import.meta.env.VITE_FRONTEND_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;   // ← FALLBACK when env var not set
  }
  return "http://localhost:5173";
}
```

### Root Cause: Why Mobile Copies Apex Domain (`localnewz.in`)

`VITE_FRONTEND_URL` is **not set** in Vercel production environment variables (only defined locally in `.env` and `.env.example`).

When `VITE_FRONTEND_URL` is not set, `getFrontendBaseUrl()` falls back to `window.location.origin`:
- **Desktop users** typically access via `https://www.localnewz.in/news/...` (bookmark, typed URL) → copies `www.localnewz.in` ✅
- **Mobile users** often access via `https://localnewz.in/news/...` (shared link from another app, search result, bookmark) → copies `localnewz.in` ❌

The apex domain redirects to www with HTTP 308, but the redirect happens at the network level. If `VITE_FRONTEND_URL` is not configured, the JavaScript reads whatever origin the browser is currently on — which on mobile may be the apex domain.

### Two Separate Issues

| Issue | Cause | Fixable via code? |
|-------|-------|-------------------|
| Mobile copies apex domain instead of www | `VITE_FRONTEND_URL` not set in Vercel production; falls back to `window.location.origin` | ✅ Yes — set env var |
| WhatsApp doesn't consistently show image for www URL without query param | WhatsApp caches link previews per URL; `?previewtest=12345` forces fresh fetch | ❌ No — WhatsApp server-side caching, not controllable from frontend |

### What Does NOT Explain the Issue

- No separate mobile component exists (same `ArticalDetails.tsx` for both)
- No mobile-specific URL construction logic
- No unwanted query parameters appended to article Copy Link (only Comment Copy Link appends `#comment-` hash)
- No backend `/share/news/` route used for article Copy Link
- Cloudinary image URL is accessible (HTTP 200 confirmed by user)
- Backend crawler endpoint returns correct OG metadata (confirmed by user)

---

## Recommended Minimal Fix

### Fix 1: Set `VITE_FRONTEND_URL` in Vercel Production (Deployment Fix)

**Vercel project environment variables (Production):**
| Variable | Value |
|----------|-------|
| `VITE_FRONTEND_URL` | `https://www.localnewz.in` |

This ensures `getFrontendBaseUrl()` always returns `https://www.localnewz.in` regardless of which domain the user initially accessed.

### Fix 2: Remove `window.location.origin` Fallback (Code Fix)

**File:** `client/src/utils/share.ts`

The `window.location.origin` fallback is the root cause of the inconsistency. When `VITE_FRONTEND_URL` is missing (e.g., misconfigured deployment), the function silently uses an unpredictable origin. Remove the fallback so the function always uses the configured domain:

```ts
export function getFrontendBaseUrl(): string {
  const configured = import.meta.env.VITE_FRONTEND_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:5173";
}
```

**Side effect:** If `VITE_FRONTEND_URL` is not set in any environment, `getFrontendBaseUrl()` returns `http://localhost:5173` instead of the current browser origin. In production, `VITE_FRONTEND_URL` must always be set (which Fix 1 ensures).

### Fix 3: `.env.example` Already Correct

`.env.example` already has `VITE_FRONTEND_URL=https://www.localnewz.in` — no change needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `client/src/utils/share.ts` | Remove `window.location.origin` fallback (lines 9-11) |

## Files NOT Modified (Confirmed Correct)

- `client/src/components/User/ArticalDetails/ArticalDetails.tsx` — uses `getShareUrl(slug)`, no mobile-specific code
- `client/src/components/User/LiveDetails/LiveDetails.tsx` — uses `getFrontendBaseUrl()` directly
- `client/vercel.json` — already correct (function + middleware deployed)
- `client/middleware.ts` — not related to Copy Link URL generation
- `backend/src/routes/share.routes.ts` — backend crawler endpoint confirmed working

---

## Deployment Steps

1. **Set `VITE_FRONTEND_URL=https://www.localnewz.in`** in Vercel project → Settings → Environment Variables → Production
2. **Remove `window.location.origin` fallback** from `client/src/utils/share.ts` (code change)
3. **Type-check & build:** `cd client && npx tsc --noEmit && npm run build`
4. **Deploy to Vercel**

---

## Production Verification (After Deploy)

| Test | Expected Result |
|------|-----------------|
| Desktop: Copy Link on article page | Copies `https://www.localnewz.in/news/<slug>` |
| Mobile: Copy Link on article page | Copies `https://www.localnewz.in/news/<slug>` (not `localnewz.in`) |
| Mobile: Paste copied URL into WhatsApp Android | Shows article image, title, description (if WhatsApp cache refreshed) |
| `curl -A "facebookexternalhit/1.1" https://www.localnewz.in/news/<slug>` | Returns HTML with correct `og:image` (Cloudinary URL) |

**Note on WhatsApp caching:** WhatsApp caches previews per URL. If a URL was previously shared without OG metadata, WhatsApp may continue showing the cached (logo-only) preview even after the fix. Use WhatsApp's "Refresh preview" or share the URL with a unique query parameter temporarily to force a fresh fetch. This is not a code issue.

---

## Potential Side Effects

- If `VITE_FRONTEND_URL` is not set in a deployment after removing the fallback, Copy Link will copy `http://localhost:5173/news/<slug>` (wrong). Mitigation: ensure env var is set before deploying.
- Comment Copy Link (`window.location.origin + pathname`) still uses browser origin — this is for comment anchors, not article sharing, and is out of scope for this fix.
- Live News Copy Link uses `getFrontendBaseUrl()` — will also benefit from the env var fix.
