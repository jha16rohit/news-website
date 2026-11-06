
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.PUBLIC_API_URL ||
  ""
).replace(/\/+$/, "");

export default async function handler(req, res) {
  const slug = req.query?.slug;

  if (!slug || Array.isArray(slug) || typeof slug !== "string") {
    return res.status(400).send("Invalid article slug");
  }

  if (!BACKEND_URL) {
    return res.status(500).send("Backend URL is not configured");
  }

  try {
    const backendRes = await fetch(
      `${BACKEND_URL}/share/news/${encodeURIComponent(slug)}`,
      {
        headers: {
          "user-agent": req.headers["user-agent"] || "",
          accept: "text/html",
        },
        redirect: "manual",
      }
    );

    const html = await backendRes.text();

    res.setHeader(
      "Content-Type",
      backendRes.headers.get("content-type") ||
        "text/html; charset=utf-8"
    );

    // Disable caching while we verify the new routing.
    res.setHeader("Cache-Control", "no-store");

    const location = backendRes.headers.get("location");
    if (location) {
      res.setHeader("Location", location);
    }

    return res.status(backendRes.status).send(html);
  } catch (error) {
    console.error("Article OG proxy error:", error);
    return res.status(502).send("Unable to generate article preview");
  }
}
