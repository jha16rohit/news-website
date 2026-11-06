// client/api/share/news/[slug].js
// Same-origin public sharing endpoint (frontend domain, e.g. Vercel).
// It proxies to the backend /share/news/:slug endpoint so the public URL never
// exposes the backend/API domain. The backend decides crawler vs. human based
// on the forwarded User-Agent:
//   - social crawlers  -> 200 HTML with article-specific Open Graph metadata
//   - normal visitors  -> 302 redirect to the real frontend article page

const BACKEND_URL =
  (process.env.BACKEND_URL || process.env.PUBLIC_API_URL || "http://localhost:5001").replace(/\/+$/, "");

export default async function handler(req, res) {
  const { slug } = req.query || {};

  if (!slug || Array.isArray(slug) || typeof slug !== "string") {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain");
    return res.end("Invalid slug");
  }

  const decodedSlug = decodeURIComponent(slug);

  try {
    // Forward the User-Agent so the backend can distinguish crawlers from humans.
    const backendRes = await fetch(
      `${BACKEND_URL}/share/news/${encodeURIComponent(decodedSlug)}`,
      {
        headers: {
          "user-agent": req.headers["user-agent"] || "",
          accept: "text/html, application/json",
        },
        redirect: "manual", // do not follow backend redirects; forward them as-is
      }
    );

    const body = await backendRes.text();
    const contentType =
      backendRes.headers.get("content-type") || "text/html; charset=utf-8";

    res.statusCode = backendRes.status;
    res.setHeader("Content-Type", contentType);
    // Cache crawler responses briefly; humans get a redirect (no-cache).
    if (backendRes.status === 200) {
      res.setHeader("Cache-Control", "public, max-age=300");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
    // Pass through the backend's location header for 3xx redirects.
    const location = backendRes.headers.get("location");
    if (location) {
      res.setHeader("Location", location);
    }

    return res.end(body);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "text/plain");
    return res.end("Unable to generate share preview");
  }
}
