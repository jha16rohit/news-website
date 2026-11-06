// ─── Centralized sharing URL helpers ────────────────────────────────────────
// All public sharing (WhatsApp, Copy Link, Facebook, X) must use the public
// frontend domain — never the backend/API domain. Both WhatsApp and Copy Link
// must share the exact same URL so social crawlers receive identical metadata.

export function getFrontendBaseUrl(): string {
  const configured = import.meta.env.VITE_FRONTEND_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

// Public sharing URL used by WhatsApp and Copy Link. Identical for both.
// Canonical public frontend article URL (never /share/news/).
export function getShareUrl(slug: string): string {
  return `${getFrontendBaseUrl()}/news/${encodeURIComponent(slug)}`;
}

// WhatsApp share URL: headline + public sharing URL.
export function getWhatsAppShareUrl(slug: string, headline: string): string {
  const shareUrl = getShareUrl(slug);
  const text = `${(headline ?? "").trim()}\n${shareUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export interface ShareArticle {
  slug: string;
  headline?: string;
  metaTitle?: string;
  excerpt?: string;
  metaDescription?: string;
  featuredImage?: string;
}

export function buildShareMeta(article: ShareArticle) {
  return {
    slug: article.slug,
    headline: article.headline || "",
    title: (article.metaTitle ?? article.headline ?? "LocalNewz").trim(),
    description:
      (article.metaDescription ?? article.excerpt ?? "").trim() || "",
    imageUrl: article.featuredImage || "",
  };
}
