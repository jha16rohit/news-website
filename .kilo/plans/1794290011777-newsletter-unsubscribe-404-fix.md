# Plan: Fix Newsletter Unsubscribe 404

## Goal
Fix the newsletter unsubscribe link so clicking it from an email reaches the backend API endpoint instead of the Vercel frontend SPA catch-all, which currently returns a 404 Page Not Found.

## 1. Summary of the proposed fix
- Generate unsubscribe URLs using the public **backend API** base URL (`PUBLIC_API_URL` / `BACKEND_URL`, e.g. `https://api.localnewz.in`) instead of the public **frontend** base URL (`PUBLIC_FRONTEND_URL`, e.g. `https://www.localnewz.in`).
- Add a `getPublicApiUrl()` helper mirroring the existing `getPublicFrontendUrl()` convention.
- Update both email functions that build unsubscribe links (`sendWelcomeEmail`, `notifyEmailSubscribersOfNewArticle`) to use the API base.
- Optionally return an HTML confirmation page (or redirect to a frontend confirmation page) instead of raw JSON after a successful unsubscribe.
- Preserve all working subscription, delivery, token generation, model, route registration, and auth-free access behavior.

## 2. Confirmed root cause
`backend/src/controllers/newsletter.controller.ts` builds unsubscribe links via `getPublicFrontendUrl()`, which resolves to `PUBLIC_FRONTEND_URL` (`https://www.localnewz.in`, the Vercel frontend). The generated link is:
```
https://www.localnewz.in/api/newsletter/unsubscribe/:token
```
`client/vercel.json` catch-all `{ "source": "/(.*)", "destination": "/index.html" }` routes this to the React SPA, which has no `/api/newsletter/unsubscribe/:token` route → 404.
The real endpoint `GET /api/newsletter/unsubscribe/:token` exists on the backend at `https://api.localnewz.in/api/newsletter/unsubscribe/:token` (`backend/src/routes/newsletter.routes.ts`, registered in `backend/src/app.ts:137`) and its controller logic (`newsletter.controller.ts:83-100`) is correct. The link simply targets the wrong host.

## 3. Proposed implementation approach
- Add `getPublicApiUrl(): string` helper in `newsletter.controller.ts` that reads `PUBLIC_API_URL` then `BACKEND_URL`, falling back to `http://localhost:5001`, with trailing-slash normalization. Mirror `getPublicFrontendUrl()` (lines 21-23) style.
- In `sendWelcomeEmail()` (line 105), build unsubscribe URL from `getPublicApiUrl()` instead of `getPublicFrontendUrl()`.
- In `notifyEmailSubscribersOfNewArticle()` (line 247), same change.
- Do not change token generation, model, route registration, CORS, or auth.
- For confirmation experience: evaluate returning an HTML confirmation page from the backend vs redirecting to a frontend confirmation page. Recommendation (to be decided at implementation): return a simple HTML confirmation page directly from `unsubscribeFromNewsletter` to avoid adding frontend routes/coupling. Keep it minimal.

## 4. Exact files to be modified

### Required
| File | Why | Proposed change |
|------|-----|-----------------|
| `backend/src/controllers/newsletter.controller.ts` | Holds `getPublicFrontendUrl()`, `sendWelcomeEmail()`, `notifyEmailSubscribersOfNewArticle()`, `unsubscribeFromNewsletter()` | Add `getPublicApiUrl()` helper; change unsubscribe URL construction in lines 105 and 247 to use API base; optionally change `unsubscribeFromNewsletter` response to HTML confirmation |

### No-change (reference only)
| File | Reason |
|------|--------|
| `backend/src/routes/newsletter.routes.ts` | Route already correct; no change |
| `backend/src/app.ts` | Registration already correct; no change |
| `backend/src/models/NewsletterSubscriber.ts` | Model/token storage correct; no change |
| `client/vercel.json` | Not involved in unsubscribe API path; no change |
| `client/vite.config.ts` | Dev-only proxy; no change |
| `backend/.env` / `.env.example` | Config already correct; verify only |

## 5. Step-by-step implementation tasks
1. Add `getPublicApiUrl()` helper in `newsletter.controller.ts` reading `PUBLIC_API_URL` then `BACKEND_URL`, fallback `http://localhost:5001`, trailing-slash normalized.
2. Update `sendWelcomeEmail()` unsubscribe URL (line 105) to use `getPublicApiUrl()`.
3. Update `notifyEmailSubscribersOfNewArticle()` unsubscribe URL (line 247) to use `getPublicApiUrl()`.
4. (Optional) Update `unsubscribeFromNewsletter()` to return an HTML confirmation page instead of raw JSON.
5. Verify production backend `.env` sets `PUBLIC_API_URL=https://api.localnewz.in` (do not modify; verify only).
6. Build (`npm run build` / `tsc`) to confirm TypeScript compiles.

## 6. Security considerations
- **GET-based unsubscribe risk:** The endpoint uses `GET`, so email security scanners, link preview bots, browser prefetch, and AV link checkers may automatically trigger an unintended unsubscribe. This is a design concern, not part of the essential fix. Keep the essential URL fix separate from any optional security improvement (e.g. switching to POST + confirmation page) for a future change.
- Token remains opaque (`crypto.randomBytes(24).toString("hex")`); email not exposed in URL.
- No authentication required (correct for email links); idempotent (setting `isActive=false` again is a no-op); does not resubscribe.

## 7. Testing and verification plan
- [ ] Welcome email unsubscribe URL uses `https://api.localnewz.in/api/newsletter/unsubscribe/<token>` (production) or `http://localhost:5001/...` (local).
- [ ] Article notification email unsubscribe URL uses the backend API domain.
- [ ] `GET` unsubscribe link returns success (200) and HTML confirmation (or JSON if optional change skipped).
- [ ] Subscriber `isActive` becomes `false` in MongoDB.
- [ ] Invalid token → `404 {"message":"Subscription not found."}`.
- [ ] Already-unsubscribed token → idempotent success, no resubscribe.
- [ ] No regression: newsletter subscription (`POST /api/newsletter/subscribe`) still works.
- [ ] No regression: new article emails still deliver with correct article and unsubscribe links.
- [ ] Local: run backend, subscribe test email, click/curl the unsubscribe link from email body.
- [ ] Production: after deploy, verify real welcome/article email link and click it.

## 8. Risks and safeguards
- Risk: wrong env var name in production → links still 404. Safeguard: verify `PUBLIC_API_URL`/`BACKEND_URL` on hosting platform matches `https://api.localnewz.in`.
- Risk: HTML confirmation page breaks email clients expecting JSON. Safeguard: keep optional; default to minimal JSON unless HTML is explicitly approved.
- Risk: trailing slash causing double slash. Safeguard: normalize with `.replace(/\/$/, "")`.

## 9. Required changes vs optional improvements
**Required (essential fix):**
- Add `getPublicApiUrl()` helper.
- Update unsubscribe URL construction in `sendWelcomeEmail()` and `notifyEmailSubscribersOfNewArticle()`.

**Optional (deferred):**
- Return HTML confirmation page from `unsubscribeFromNewsletter()` instead of raw JSON.
- Switch unsubscribe endpoint from GET to POST to mitigate scanner-triggered unsubscribes.

## 10. Expected final behavior
- Unsubscribe link in emails points to `https://api.localnewz.in/api/newsletter/unsubscribe/<token>`.
- Clicking the link reaches the backend, validates the token, sets `isActive=false`, and shows a confirmation.
- Invalid tokens return 404 JSON; already-unsubscribed tokens are idempotent.
- Subscription and article email delivery remain unchanged.

---

Plan created. No files have been modified. Awaiting explicit user approval before implementation.