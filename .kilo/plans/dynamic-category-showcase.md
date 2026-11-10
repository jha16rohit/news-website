# LocalNewz — Dynamic Category Showcase News Fetching System (Final)

## Root Cause

The home page fetches **all published news in a single global request** (`fetchAllNews()` → backend defaults `limit: 20`), then `CategoryShowcase.tsx` filters those 20 articles by category name using fragile string matching. With 8+ categories competing for 20 slots, most categories get only 1–2 articles. Adding categories or articles makes it worse.

## Field Name Resolution

| Layer | Field | Value |
|-------|-------|-------|
| DB model (`Category.ts`) | `showcase` (bool), `active` (bool) | Source of truth |
| API response (`category.controller.ts`) | `inShowcase` (from `showcase`), `enabled` (from `active`) | Mapped in responses |
| Frontend (`CategoryShowcase.tsx`) | `c.inShowcase && c.enabled` | Filters showcase categories |

**Decision:** Backend endpoint queries `Category.find({ showcase: true, active: true })`. Frontend continues using `inShowcase`/`enabled` as returned by `getPublicCategories`. No model changes needed.

## Query Strategy

**Chosen:** Two batch queries + per-category parallel News queries with bounded concurrency.

### Step 1 — Fetch showcase categories (batch)
`Category.find({ showcase: true, active: true }).lean()`

### Step 2 — Fetch all active children in ONE batch (improvement)
`Category.find({ parentId: { $in: showcaseCategoryIds }, active: true }).select("_id parentId").lean()`

### Step 3 — Group children by parent ID in memory
Build `Map<parentId, string[]>` mapping parent category ID → array of child category IDs.

### Step 4 — Per-category News queries with bounded concurrency (improvement)
For each showcase category, allowed ID set = `[cat._id, ...childrenIds]`. Query:
`News.find({ categoryId: { $in: ids }, status: "PUBLISHED" }).sort({ publishedAt: -1, createdAt: -1 }).limit(10).lean()`

**Bounded concurrency:** Process showcase categories in batches of 10. Within each batch, `Promise.all` runs the News queries in parallel. Between batches, await completion before starting the next. This caps concurrent database connections at 10 regardless of showcase category count (4, 10, 20, 50+).

### Step 5 — Batch enrich category names
Single `Category.find({ _id: { $in: allArticleCategoryIds } }).select("_id name color").lean()` for all articles returned across all categories.

### Step 6 — Build response
Categories with zero articles still appear with `articles: []`. No global deduplication (category-specific: same article can appear under both parent and child if both are showcased).

**categoryId data type:** Confirmed `String` in `News.ts` model (line 99-103: `type: String, required: true, index: true`). All comparisons use `String()` casts — no ObjectId assumptions.

## Sorting

`{ publishedAt: -1, createdAt: -1 }` — both indexed fields in `News.ts`.

## Deduplication Policy

**Category-specific, not global.** An article has exactly one `categoryId`. If that category is a child of a showcase parent, the article appears under both the child (if independently showcased) and the parent. This is intentional.

## Dynamic Behavior

Endpoint queries categories at request time. Adding/enabling/disabling/removing showcase categories takes effect on next page load — no code change, no cache invalidation.

## Backend Changes

### New controller: `getHomepageShowcase` in `backend/src/controllers/news.controller.ts`

1. `autoPublishDueScheduled()` (existing pattern)
2. `Category.find({ showcase: true, active: true }).lean()` — showcase categories
3. `Category.find({ parentId: { $in: showcaseIds }, active: true }).select("_id parentId").lean()` — all active children in one batch
4. Group children by parentId in memory → `Map<parentId, string[]>`
5. For each showcase category: allowed IDs = `[cat._id, ...childrenMap.get(cat._id) || []]`
6. Bounded concurrency (batch size 10): per-category `News.find({ categoryId: { $in: ids }, status: "PUBLISHED" }).sort({ publishedAt: -1, createdAt: -1 }).limit(10).lean()` in `Promise.all` within each batch
7. Collect all article categoryIds, batch enrich: `Category.find({ _id: { $in: allCatIds } }).select("_id name color").lean()`
8. Build response: `{ success: true, categories: [{ id, name, slug, color, articles: [] }] }`

### New route in `backend/src/routes/news.routes.ts`

`router.get("/homepage-showcase", getHomepageShowcase)` — placed **before** the `/:id` catch-all (line 227).

## Frontend Changes

### `client/src/api/user/news.ts`

Add `ShowcaseCategory` type:
```ts
export interface ShowcaseCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
  articles: NewsArticle[];
}
```

Add `getHomepageShowcase()`:
```ts
export const getHomepageShowcase = async (): Promise<{ success: boolean; categories: ShowcaseCategory[] }> =>
  apiClient("/api/news/homepage-showcase");
```

### `client/src/components/User/UserDashboard.tsx`

- Replace `fetchAllNews()` with `getHomepageShowcase()` in `Promise.all`
- Replace `allNews` state with `showcaseCategories` state
- Pass `showcaseCategories` to `CategoryShowcase`
- Remove `fetchAllNews` import if unused elsewhere

### `client/src/components/User/CategoryShowcase.tsx`

- New prop: `showcaseCategories: ShowcaseCategory[]` — each entry has its own `articles` array (up to 10, latest PUBLISHED)
- Remove: `articles` prop, `realArticles` filter, `allowedCategories` string matching, `displayArticles = realArticles.slice(0, 10)`
- Keep: All layout logic (`hero-sidebar`, `grid-3`, `split-sidebar`, `grid-4`, `hero-reversed`), `getArticleUrl`, `View All` link, `slugOf`
- Component maps over `showcaseCategories`, renders each category's `articles` directly

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/controllers/news.controller.ts` | Add `getHomepageShowcase` controller with batch child queries + bounded concurrency |
| `backend/src/routes/news.routes.ts` | Register `GET /homepage-showcase` before `/:id` catch-all |
| `client/src/api/user/news.ts` | Add `getHomepageShowcase()` + `ShowcaseCategory` type |
| `client/src/components/User/UserDashboard.tsx` | Replace `fetchAllNews()` with `getHomepageShowcase()` |
| `client/src/components/User/CategoryShowcase/CategoryShowcase.tsx` | Accept `showcaseCategories`, remove fragile filtering |

## Files NOT Modified

- All existing backend controller functions (`getPublishedNews`, `getHomepageNews`, etc.)
- `backend/src/models/News.ts`, `backend/src/models/Category.ts`
- `backend/src/routes/category.routes.ts`, `backend/src/controllers/category.controller.ts`
- `client/src/api/news.ts` (`fetchAllNews` unchanged)
- `client/src/components/User/HomeHero/HomeHero.tsx`
- `client/src/components/User/LatestNews/LatestNews.tsx`

## Validation

1. Backend `tsc --noEmit` and `npm run build` pass
2. Frontend `tsc --noEmit` and `npm run build` pass
3. Showcase categories (`showcase: true && active: true`) show up to 10 latest PUBLISHED articles each
4. Non-showcase categories do not appear
5. Categories with zero articles appear with empty `articles` array
6. Child category articles appear under parent showcase category
7. Independently enabled child categories appear as separate sections
8. Same article can appear under both parent and child (category-specific, no global dedup)
9. `View All` links work (`/category/<slug>`)
10. All 5 layouts render correctly
11. No hardcoded category names
12. Bounded concurrency caps concurrent News queries at 10
