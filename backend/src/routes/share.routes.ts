import { Router, Request, Response } from "express";
import News from "../models/News";

const router = Router();

const escapeHtml = (value: unknown): string => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

router.get("/news/:slug", async (req: Request, res: Response) => {
  try {
    const news = await News.findOne({
      slug: String(req.params.slug),
      status: "PUBLISHED",
    }).lean();

    if (!news) {
      return res.status(404).send("News not found");
    }

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const publicApiUrl = (
      process.env.PUBLIC_API_URL || "http://localhost:5001"
    ).replace(/\/$/, "");

    const articleUrl = `${frontendUrl}/news/${encodeURIComponent(news.slug)}`;

    let imageUrl = news.featuredImage || "";

    // Convert relative uploaded images into absolute URLs
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${publicApiUrl}${imageUrl}`;
    }

    const title =
      news.metaTitle?.trim() ||
      news.headline?.trim() ||
      "LocalNewz";

    const description =
      news.metaDescription?.trim() ||
      news.excerpt?.trim() ||
      "";

    const canonicalUrl =
      news.canonicalUrl?.trim() || articleUrl;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <title>${escapeHtml(title)}</title>

  <meta
    name="description"
    content="${escapeHtml(description)}"
  />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta
    property="og:description"
    content="${escapeHtml(description)}"
  />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  ${
    imageUrl
      ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`
      : ""
  }

  <meta property="og:site_name" content="LocalNewz" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta
    name="twitter:description"
    content="${escapeHtml(description)}"
  />

  ${
    imageUrl
      ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`
      : ""
  }

  <link
    rel="canonical"
    href="${escapeHtml(canonicalUrl)}"
  />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(articleUrl)}" />

  <script>
    window.location.replace(${JSON.stringify(articleUrl)});
  </script>
</head>

<body>
  <p>
    Redirecting to
    <a href="${escapeHtml(articleUrl)}">
      ${escapeHtml(title)}
    </a>
  </p>
</body>
</html>
`;

    return res.status(200).send(html);
  } catch (error) {
    console.error("Share preview error:", error);
    return res.status(500).send("Unable to generate share preview");
  }
});

export default router;