// client/middleware.ts
// Vercel Routing Middleware for the LocalNewz Vite + React SPA.
// Non-Next.js API: standard Web Request/Response + @vercel/functions helpers.
//
// Routing rule:
//   - Social media crawlers fetching /news/:slug  -> rewrite to
//     /api/share/news/:slug  (function proxies to backend, which returns
//     article-specific Open Graph / Twitter HTML).
//   - Normal visitors  -> next()  -> vercel.json catch-all -> /index.html ->
//     React SPA loads normally (React Router handles /news/:slug).
//
// This avoids a redirect loop: a static vercel.json rewrite of
// /news/:slug -> function would send humans to the function, which 302s
// back to /news/:slug forever.

import { next, rewrite } from "@vercel/functions";

const SOCIAL_CRAWLER_UA = /facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|applebot|bot|crawler|spider|curl|wget/i;

export const config = {
  runtime: "edge",
  // Only run middleware on article URLs; everything else falls straight
  // through to the SPA catch-all.
  matcher: ["/news/:slug"],
};

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const isCrawler = SOCIAL_CRAWLER_UA.test(ua);

  // Crawlers: rewrite to the backend-proxied share function so they receive
  // server-generated article-specific Open Graph metadata (no redirect).
  if (isCrawler && /^\/news\/[^/]+$/.test(url.pathname)) {
    const slug = url.pathname.split("/").pop()!;
    return rewrite(`/api/share/news/${encodeURIComponent(slug)}`);
  }

  // Humans: pass through to the SPA (index.html) so React Router renders the
  // article page normally. No redirect, no loop.
  return next();
}
