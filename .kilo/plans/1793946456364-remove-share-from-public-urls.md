# LocalNewz — Vercel Routing Fix: API Function Not Invoked

**Status:** Diagnosis complete. Implementation-ready.

---

## Confirmed Production Facts

| # | Observation | Status |
|---|-------------|--------|
| 1 | Render backend `GET /share/news/:slug` with `facebookexternalhit/1.1` → HTTP 200, correct OG/Twitter HTML, Cloudinary `og:image` | ✅ Verified by user |
| 2 | Vercel `GET /api/share/news/:slug` → HTTP 200, but serves React `index.html` instead of API function response | ❌ Confirmed bug |
| 3 | Same problem on `/news/:slug` and `/share/news/:slug` | ❌ Confirmed bug |
| 4 | Vercel Root Directory = `client/` | ✅ Confirmed |
| 5 | Vercel Resources shows both `/api/share/news/[slug]` function AND `/news/:slug` middleware exist | ✅ Confirmed (both deployed) |
| 6 | Auth disabled but still returns `index.html` | ✅ Confirmed |
| 7 | Local files verified: `vercel.json`, `middleware.ts`, `[slug].js` | ✅ Confirmed |
| 8 | Only one `vercel.json` exists (at `client/vercel.json`) | ✅ Verified locally |
| 9 | `@vercel/functions` installed in `client/` | ✅ Verified locally |
| 10 | API function uses correct convention: `export default async function handler(req, res)` | ✅ Verified locally |

---

## Verified Root Cause

### A. Why does `/api/share/news/:slug` return `index.html`?

**Root cause: The catch-all rewrite `{ "source": "/(.*)", "destination": "/index.html" }` intercepts ALL paths including `/api/` routes before Vercel's Functions system can invoke the API function.**

Vercel processes rewrites in array order (first match wins), and rewrites take precedence over Serverless Functions. This is confirmed by Vercel documentation:

- Vercel Knowledge Base: *"If the SPA also serves API routes, exclude them from the fallback with a negative lookahead, or every API call gets rewritten to index.html too"*
- Vercel docs: *"Vercel processes routes in the order you define them in the array, so wildcard/catch-all patterns should usually be last."*
- Multiple community sources confirm: `{ "source": "/api/(.*)", "destination": "/api/$1" }, { "source": "/(.*)", "destination": "/index.html" }` is the correct fix

**Tracing routing for each URL:**

| URL | Middleware (`/news/:slug`) | Rewrite 1 (`/share/news/:slug`) | Rewrite 2 (`/(.*)` → `/index.html`) | Function invoked? |
|-----|---------------------------|----------------------------------|--------------------------------------|-------------------|
| `/api/share/news/slug` | No match | No match | **MATCH** → `index.html` | ❌ No |
| `/share/news/slug` | No match | Match → `/api/share/news/slug` | Re-processed: **MATCH** → `index.html` | ❌ No |
| `/news/slug` (crawler) | Match → rewrite to `/api/share/news/slug` | — | Re-processed: **MATCH** → `index.html` | ❌ No |
| `/news/slug` (human) | Match → `next()` | — | Catch-all serves `index.html` (SPA) | N/A |

**Conclusion:** The catch-all rewrite is the sole cause. Both the deployed function and middleware are correct but bypassed by the catch-all.

### B. Function runtime/export convention

`client/api/share/news/[slug].js:12` uses `export default async function handler(req, res)` — the **correct** non-Next.js Vercel serverless function convention. No change needed.

### C. Is middleware intercepting `/api/*`?

**No.** Middleware `matcher: ["/news/:slug"]` only matches `/news/:slug`, not `/api/*`. Middleware is not causing this issue.

### D. Function logs / invocation status

Cannot access Vercel dashboard or function logs in Plan Mode. Based on symptoms (HTTP 200 + `index.html`, not 502/500), the function is **not being invoked at all** — the rewrite intercepts before the Function.

### E. Is `BACKEND_URL` configured for Production?

Cannot verify without Vercel dashboard. Must be set to `https://localnewz-backend.onrender.com` for the proxy to work once routing is fixed.

### F. Deployment alias serving intended deployment?

Cannot verify without Vercel dashboard. Both function and middleware appear in Resources.

---

## Files to Modify

### 1. `client/vercel.json` — Fix catch-all to exclude `/api/`

**Current (buggy):**
```json
{
  "rewrites": [
    { "source": "/share/news/:slug", "destination": "/api/share/news/:slug" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Fixed:**
```json
{
  "rewrites": [
    { "source": "/share/news/:slug", "destination": "/api/share/news/:slug" },
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This is the documented Vercel solution: API routes are matched before the catch-all, allowing Vercel's Functions system to invoke them. The catch-all remains last for SPA fallback.

### 2. `client/src/components/Admin/CreateNewArticle/CreateNewArticle.tsx` — Fix `yournewssite.com` placeholder

- Line 1558: `canonicalUrl: urlSlug ? \`https://yournewssite.com/news/${urlSlug}\` : undefined` → `https://www.localnewz.in/news/${urlSlug}`
- Line 1794: `const googlePreviewUrl = \`https://yournewssite.com/news/${urlSlug || "article-slug"}\`;` → `https://www.localnewz.in/news/${urlSlug || "article-slug"}`

### Already correct (no change needed)
- `client/middleware.ts` — matcher limited to `/news/:slug`, doesn't intercept `/api/*`
- `client/api/share/news/[slug].js` — correct handler signature, proxies with UA forwarding
- `client/src/utils/share.ts` — `getShareUrl` → `/news/:slug` (already fixed)
- `client/src/components/User/LiveDetails/LiveDetails.tsx` — uses `/live/:eventId` (already fixed)
- `backend/src/routes/share.routes.ts` — correct OG HTML, crawler/human split, `PUBLISHED`-only
- `backend/src/app.ts` — mounts `shareRoutes` at `/share`

---

## Deployment Settings Required

### Vercel project dashboard settings
| Setting | Value |
|---------|-------|
| Root Directory | `client/` (already confirmed) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Vercel project environment variables (Production)
| Variable | Required Value |
|----------|---------------|
| `VITE_FRONTEND_URL` | `https://www.localnewz.in` |
| `VITE_API_URL` | `https://api.localnewz.in` |
| `BACKEND_URL` | `https://localnewz-backend.onrender.com` |
| `PUBLIC_API_URL` | `https://localnewz-backend.onrender.com` |

### Backend (Render) environment variables
| Variable | Required Value |
|----------|---------------|
| `PUBLIC_FRONTEND_URL` | `https://www.localnewz.in` |
| `PUBLIC_API_URL` | `https://localnewz-backend.onrender.com` |

---

## Step-by-Step Implementation Plan

1. **Modify `client/vercel.json`** — Add `/api/:path*` rewrite rule before catch-all to prevent `index.html` interception of API routes (documented Vercel solution).
2. **Modify `client/src/components/Admin/CreateNewArticle/CreateNewArticle.tsx`** — Replace `yournewssite.com` with `www.localnewz.in` on lines 1558 and 1794.
3. **Type-check & build:** `cd client && npx tsc --noEmit` and `npm run build`.
4. **Deploy to Vercel:** Push to connected Git repo or run `vercel deploy`.
5. **Verify production (after deployment):**
   - `curl -A "facebookexternalhit/1.1" https://www.localnewz.in/api/share/news/indian-railway-special-train` → HTTP 200, article-specific OG HTML (NOT `index.html`)
   - `curl -A "facebookexternalhit/1.1" https://www.localnewz.in/news/indian-railway-special-train` → HTTP 200, article-specific OG HTML (middleware rewrite working)
   - Browser: `https://www.localnewz.in/news/<slug>` → React SPA loads (no redirect loop)
   - `og:image` = actual Cloudinary `featuredImage` URL
   - `og:url` = `https://www.localnewz.in/news/<slug>`
   - `canonical` = `https://www.localnewz.in/news/<slug>` (not `yournewssite.com`)
   - Old `/share/news/<slug>` → OG for crawlers, 302 to `/news/<slug>` for humans

---

## Acceptance Criteria

- `/api/share/news/:slug` returns article-specific OG HTML (not `index.html`)
- `/news/:slug` returns article-specific OG HTML to social crawlers
- `/news/:slug` loads React SPA for normal visitors (no redirect loop)
- `og:image` points to actual Cloudinary `featuredImage`
- `og:url` and `canonical` = `https://www.localnewz.in/news/:slug`
- Old `/share/news/:slug` links still work (backward-compat)

**Do not modify MongoDB image storage or Cloudinary upload logic.**

**Items requiring user verification after deployment:** Vercel `BACKEND_URL`/`PUBLIC_API_URL` env vars, Vercel function invocation logs, deployment alias target.