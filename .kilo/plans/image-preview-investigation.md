# LocalNewz — Image Preview Investigation (Diagnosis Only)

**Status:** Investigation complete. No source files modified. Awaiting implementation approval.

**Problem:** WhatsApp Share and Copy Link show the default LocalNewz logo instead of the article's specific featured image.

---

## Image Preview Pipeline (end-to-end)

```
1. Admin uploads image via form
        │
        ▼
2. Upload.middleware.ts → Cloudinary uploader.upload()
        │   stores result.secure_url (absolute HTTPS, e.g.
        │   https://res.cloudinary.com/rnkgwj5o/news-images/abc.jpg)
        │   in (req).uploadedImageUrl
        ▼
3. News controller (createNews / updateNews / uploadMediaImage)
        │   stores uploadedImageUrl in MongoDB field `featuredImage`
        ▼
4. MongoDB News.featuredImage = Cloudinary secure_url string
        ▼
5. Backend share.routes.ts GET /share/news/:slug
        │   reads news.featuredImage
        │   puts in og:image, og:image:secure_url, twitter:image
        ▼
6. Vercel function client/api/share/news/[slug].js
        │   proxies to backend, forwards User-Agent
        ▼
7. Vercel middleware client/middleware.ts
        │   crawler UA + /news/:slug → rewrite to /api/share/news/:slug
        ▼
8. Social crawler receives HTML with article-specific og:image
```

---

## Confirmed Findings (by source code)

### 1. featuredImage field (News model)
**File:** `backend/src/models/News.ts:41,167`
- `featuredImage?: String` — optional, single string field
- Cloudinary `secure_url` is stored here (absolute HTTPS)
- There is **no image array/gallery** — only one `featuredImage` field
- Images embedded in article body content are separate (extracted via `extractImagesFromContent`), not used for social preview

### 2. Image retrieval in share route
**File:** `backend/src/routes/share.routes.ts:52-70`
```js
let imageUrl = String(news.featuredImage || "");
if (imageUrl && imageUrl.startsWith("/")) {
  imageUrl = `${publicApiUrl}${imageUrl}`;
}
if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
  imageUrl = "";
}
```
- Reads `news.featuredImage` from MongoDB
- Cloudinary URLs (already `https://`) pass through unchanged
- Relative paths starting with `/` get prefixed with `publicApiUrl`
- Non-HTTP(S) values are blanked out

### 3. OG metadata in HTML response
**File:** `backend/src/routes/share.routes.ts:88-99`
```js
${ogImage
  ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />`
  : ""}
...
${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ""}
```
- `og:image`, `og:image:secure_url`, `og:image:alt`, `twitter:image` are all set from the same `ogImage` value
- **Conditional**: if `ogImage` is empty string, NONE of these tags are rendered at all

### 4. Image URL accessibility handling
**File:** `backend/src/routes/share.routes.ts:43-45`
```js
const publicApiUrl = (
  process.env.PUBLIC_API_URL || process.env.FRONTEND_URL || "http://localhost:5001"
).replace(/\/$/, "");
```
- `publicApiUrl` defaults to `http://localhost:5001` if both `PUBLIC_API_URL` and `FRONTEND_URL` are unset
- **Only affects relative paths** (starting with `/`). Cloudinary URLs are already absolute HTTPS and bypass this.

### 5. Middleware / share function for crawlers
**File:** `client/middleware.ts:34-37` — crawler UA + `/news/:slug` → rewrite to `/api/share/news/:slug`
**File:** `client/api/share/news/[slug].js:25-34` — proxies to backend, forwards User-Agent
**File:** `backend/src/routes/share.routes.ts:111-123` — crawlers get `200` HTML with OG tags; humans get `302` redirect

### 6. Frontend normalization
**File:** `client/src/components/User/ArticalDetails/ArticalDetails.tsx:174`
```js
imageUrl: raw.featuredImage ?? raw.imageUrl ?? raw.img,
```
- Correctly prefers `featuredImage` from the backend article record

---

## Root Cause Analysis

### Primary root cause: `featuredImage` may be empty/null in MongoDB

When `news.featuredImage` is `undefined`, `null`, or `""`:
- `imageUrl = ""` (line 52)
- `ogImage = ""` (line 70)
- The conditional `${ogImage ? ... : ""}` (line 88) renders **no `og:image`, `og:image:secure_url`, or `twitter:image` tags at all**
- Social crawlers receive HTML with **no image metadata** → WhatsApp/Facebook fall back to the default site logo

**Why `featuredImage` could be empty:**
- Article created via JSON API call without file upload (no `uploadedImageUrl` from middleware, and `featuredImage` body field may be empty)
- Article created before Cloudinary upload was wired in
- Image deleted via `deleteMediaImage` (sets `featuredImage: null`)
- Cloudinary upload failed silently, leaving `featuredImage` unset

### Secondary root cause: Middleware / function not deployed

If `client/middleware.ts` and `client/api/share/news/[slug].js` are not deployed to Vercel:
- Social crawlers fetch `https://www.localnewz.in/news/<slug>`
- Vercel catch-all serves `/index.html` (SPA shell)
- `index.html` has **no `og:image`** (only default `og:site_name`, `og:type=website`, `twitter:card`)
- React `useEffect` SEO tags (which DO set `og:image`) never execute for crawlers
- Result: default logo

### Tertiary root cause: `publicApiUrl` defaults to localhost

If `PUBLIC_API_URL` and `FRONTEND_URL` are unset in production:
- `publicApiUrl = "http://localhost:5001"`
- Only affects articles with **relative** `featuredImage` paths (e.g., `/uploads/xxx.jpg`)
- Those images would be unreachable from social crawlers (localhost is not public)
- Cloudinary URLs are unaffected

### Multiple images question
The News schema has **one** `featuredImage` field. There is no image array. If an article has multiple uploaded images (in content or gallery), only `featuredImage` is used for social preview. Other images in content are not candidates for `og:image`.

---

## What I Could NOT Verify (no execution access)

| Item | Why not verified |
|------|-----------------|
| Actual `featuredImage` values in MongoDB | Cannot query database |
| Whether Cloudinary image URLs return HTTP 200 | Cannot execute curl |
| Whether middleware/Vercel function is deployed | Cannot access deployment |
| Actual HTML received by Facebook/WhatsApp crawler | Cannot execute crawler UA request |
| Image response headers, content type, redirects | Cannot execute network requests |

**Limitation explicitly noted:** No live tests were executed. All findings are from static source-code analysis.

---

## HTML Metadata Received by Crawler (predicted)

If `featuredImage` is populated with a Cloudinary URL:
```html
<meta property="og:image" content="https://res.cloudinary.com/rnkgwj5o/news-images/xxx.jpg" />
<meta property="og:image:secure_url" content="https://res.cloudinary.com/rnkgwj5o/news-images/xxx.jpg" />
<meta property="og:image:alt" content="Article Headline" />
<meta name="twitter:image" content="https://res.cloudinary.com/rnkgwj5o/news-images/xxx.jpg" />
```

If `featuredImage` is empty/null:
```html
<!-- No og:image, og:image:secure_url, or twitter:image tags at all -->
```

---

## Files That Need Modification

| File | Change Needed |
|------|---------------|
| `backend/src/routes/share.routes.ts` | Add fallback default social image when `featuredImage` is missing; validate image URL accessibility; log when image is missing |
| `backend/src/controllers/news.controller.ts` | Ensure `featuredImage` is always set on publish (validation at create/publish time) |
| `client/middleware.ts` | Already correct — no change needed (assuming deployed) |
| `client/api/share/news/[slug].js` | Already correct — no change needed (assuming deployed) |

---

## Recommended Fix

1. **Backend share route (`share.routes.ts`):** When `featuredImage` is missing/empty, fall back to a configured default social preview image (`DEFAULT_OG_IMAGE` env var) instead of rendering no image tag at all. This ensures crawlers always receive *some* image.

2. **Backend news controller:** Add validation that `featuredImage` is present before an article can be set to `PUBLISHED` status. Prevent publishing articles without a featured image.

3. **Environment variable:** Add `DEFAULT_OG_IMAGE` (Cloudinary URL of default social preview image) to backend `.env` and `.env.example`.

4. **Deploy middleware + function:** Ensure `client/middleware.ts` and `client/api/share/news/[slug].js` are deployed to Vercel so crawlers reach the backend share route.

5. **Verify:** Query MongoDB for articles with missing `featuredImage`; curl image URLs to confirm HTTP 200 and `image/*` content type; curl share endpoint with crawler UA to confirm `og:image` is present.

---

## Acceptance Criteria (to verify after fix)

- `curl -A "facebookexternalhit/1.1" https://www.localnewz.in/news/<slug>` returns HTML with `og:image` pointing to the article's Cloudinary featured image
- The `og:image` URL returns HTTP 200 with `Content-Type: image/*` when fetched directly
- Articles without a featured image fall back to `DEFAULT_OG_IMAGE` (not blank, not logo)
- WhatsApp/Copy Link previews show the article-specific image, not the default logo
