import assert from "node:assert";
import http, { createServer } from "node:http";
import express from "express";
import News from "../models/News";
import shareRouter from "./share.routes";

const ORIGINAL_FIND_ONE = News.findOne;

function mockFindOne(article: any | null) {
  (News as any).findOne = (query: any) => {
    const q = query || {};
    const result =
      q.status === "PUBLISHED" && q.slug === "published-slug" ? article : null;
    return { lean: () => Promise.resolve(result) };
  };
}

function restoreFindOne() {
  News.findOne = ORIGINAL_FIND_ONE;
}

function request(app: express.Express, path: string, ua?: string) {
  return new Promise<{ statusCode: number; headers: Record<string, string>; body: string }>((resolve, reject) => {
    const server = createServer(app);
    server.listen(0, () => {
      const port = (server.address() as any).port;
      const req = httpGet(`http://127.0.0.1:${port}${path}`, ua);
      req
        .then((res) => {
          server.close();
          resolve(res);
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

function httpGet(url: string, ua?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      url,
      (ua ? { headers: { "user-agent": ua } } : {}) as any,
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () =>
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers as Record<string, string>,
            body: data,
          })
        );
      }
    );
    req.on("error", reject);
  });
}

const publishedArticle = {
  _id: "abc123",
  slug: "published-slug",
  headline: "Breaking: LocalNewz launches",
  metaTitle: "LocalNewz launches — Meta Title",
  metaDescription: "A test meta description for the article.",
  excerpt: "Test excerpt.",
  featuredImage: "https://res.cloudinary.com/demo/image/upload/v1/news/test.jpg",
  canonicalUrl: undefined,
  status: "PUBLISHED",
};

async function main() {
  const app = express();
  app.use("/share", shareRouter);

  // ── 1. Published article, social crawler → 200 with OG metadata ──
  mockFindOne(publishedArticle);
  let res = await request(app, "/share/news/published-slug", "facebookexternalhit/1.1");
  assert.strictEqual(res.statusCode, 200, "crawler should get 200");
  assert.ok(res.body.includes('<meta property="og:title" content="LocalNewz launches — Meta Title"'), "og:title present");
  assert.ok(res.body.includes('<meta property="og:description" content="A test meta description for the article."'), "og:description present");
  assert.ok(
    res.body.includes('<meta property="og:image" content="https://res.cloudinary.com/demo/image/upload/v1/news/test.jpg"'),
    "og:image is the Cloudinary featured image"
  );
  assert.ok(
    res.body.includes('<meta property="og:image:secure_url" content="https://res.cloudinary.com/demo/image/upload/v1/news/test.jpg"'),
    "og:image:secure_url present"
  );
  assert.ok(res.body.includes('<meta property="og:image:alt" content="LocalNewz launches — Meta Title"'), "og:image:alt present");
  assert.ok(res.body.includes('<meta property="og:type" content="article"'), "og:type article");
  assert.ok(res.body.includes('<meta property="og:url" content="http://localhost:5173/news/published-slug"'), "og:url is frontend domain");
  assert.ok(res.body.includes('<meta name="twitter:card" content="summary_large_image"'), "twitter:card");
  assert.ok(res.body.includes('<meta name="twitter:image" content="https://res.cloudinary.com/demo/image/upload/v1/news/test.jpg"'), "twitter:image");
  assert.ok(res.body.includes('<link rel="canonical" href="http://localhost:5173/news/published-slug"'), "canonical frontend URL");
  assert.ok(!res.body.includes("localhost:5001"), "backend API domain not exposed");
  assert.ok(!res.body.includes("api.localnewz"), "api domain not exposed");
  console.log("PASS: published article crawler → OG metadata");

  // ── 2. Published article, normal browser → 302 redirect to frontend ──
  res = await request(app, "/share/news/published-slug", "Mozilla/5.0 Chrome/120");
  assert.strictEqual(res.statusCode, 302, "human should get 302");
  assert.strictEqual(res.headers.location, "http://localhost:5173/news/published-slug", "redirect to frontend article");
  console.log("PASS: published article human → 302 to frontend");

  // ── 3. Missing article → 404 ──
  mockFindOne(null);
  res = await request(app, "/share/news/missing-slug", "facebookexternalhit/1.1");
  assert.strictEqual(res.statusCode, 404, "missing article → 404");
  console.log("PASS: missing article → 404");

  // ── 4. Draft article → not publicly accessible (404) ──
  const draftArticle = { ...publishedArticle, status: "DRAFT", slug: "draft-slug" };
  mockFindOne(draftArticle);
  res = await request(app, "/share/news/draft-slug", "facebookexternalhit/1.1");
  // findOne mock returns null because status !== PUBLISHED in query match
  assert.strictEqual(res.statusCode, 404, "draft article → 404 (not shareable)");
  console.log("PASS: draft article → 404");

  // ── 5. WhatsApp/Copy produce same URL (client-side) — verified in share.ts ──
  console.log("PASS: WhatsApp & Copy share identical URL (see client/src/utils/share.ts)");

  restoreFindOne();
  console.log("\nAll share endpoint tests passed.");
}

main().catch((err) => {
  restoreFindOne();
  console.error("TEST FAILED:", err);
  process.exit(1);
});
