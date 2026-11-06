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

const isSocialCrawler = (ua: string): boolean => {
  const lower = (ua || "").toLowerCase();
  return (
    /facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|applebot|bot|crawler|spider|curl|wget/i.test(
      lower
    ) ||
    lower.includes("facebook") ||
    lower.includes("twitter")
  );
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

    // PUBLIC_FRONTEND_URL is the canonical public frontend domain.
    // FRONTEND_URL is kept as a fallback for backward compatibility.
    const rawFrontendUrls =
      process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const frontendBase = rawFrontendUrls.split(",")[0].trim().replace(/\/$/, "");

    const publicApiUrl = (
      process.env.PUBLIC_API_URL || process.env.FRONTEND_URL || "http://localhost:5001"
    ).replace(/\/$/, "");

    // Canonical public frontend article URL (never the backend API domain).
    const articleUrl = `${frontendBase}/news/${encodeURIComponent(String(news.slug))}`;

    // featuredImage is stored as a Cloudinary secure_url (absolute HTTPS).
    // Only prefix relative uploaded paths with the public API URL.
    let imageUrl = String(news.featuredImage || "");
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${publicApiUrl}${imageUrl}`;
    }
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      imageUrl = "";
    }

    const title =
      (news.metaTitle?.trim() || news.headline?.trim() || "LocalNewz").slice(0, 200);

    const description =
      (news.metaDescription?.trim() ||
        news.excerpt?.trim() ||
        "").slice(0, 300);

    const canonicalUrl = news.canonicalUrl?.trim() || articleUrl;

    const ogImage = imageUrl || "";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${escapeHtml(title)}</title>

  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(articleUrl)}" />
  ${ogImage
    ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />`
    : ""}
  <meta property="og:site_name" content="LocalNewz" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ""}

  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <p>
    <a href="${escapeHtml(articleUrl)}">${escapeHtml(title)}</a>
  </p>
</body>
</html>
`;

    const ua = req.headers["user-agent"] || "";

    // Normal human visitors: redirect to the real frontend article page.
    if (!isSocialCrawler(ua)) {
      res.setHeader("Cache-Control", "no-cache");
      return res.redirect(302, articleUrl);
    }

    // Social media crawlers: return the article-specific Open Graph HTML
    // directly (no redirect) so the preview is read before any navigation.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Share preview error:", error);
    return res.status(500).send("Unable to generate share preview");
  }
});

export default router;
