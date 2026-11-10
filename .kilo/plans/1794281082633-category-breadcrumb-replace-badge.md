# Plan: Replace Category Badge with Category Breadcrumb in Article Details

## Goal
Remove the standalone red category badge (`<span className="category-badge">`) from the Article Details page and display the article's category as a red-text breadcrumb item between Home and the article title.

## Files to Modify

### 1. `client/src/components/User/ArticalDetails/ArticalDetails.tsx`

**Change A — Breadcrumb JSX (lines 1011–1031)**
Replace the existing breadcrumb block that renders Home → parentCategory → category → title with:

```tsx
{/* ── BREADCRUMB ── */}
<div className="breadcrumb">
  <Link to="/" className="bc-link">होम</Link>
  {displayCategory && (
    <>
      <span className="bc-sep">/</span>
      {article.category?.slug || article.parentCategory?.slug ? (
        <Link
          to={`/category/${article.category?.slug || article.parentCategory?.slug}`}
          className="bc-link"
        >
          {displayCategory}
        </Link>
      ) : (
        <span className="bc-link">{displayCategory}</span>
      )}
    </>
  )}
  <span className="bc-sep">/</span>
  <span className="bc-current">{article.headline}</span>
</div>
```

Rationale:
- `displayCategory` is already computed at line 993 as `article.category?.name || article.parentCategory?.name || ""`.
- The link target uses `article.category?.slug || article.parentCategory?.slug` — same priority as the name fallback.
- When no slug exists, render as a plain `<span>` with `.bc-link` class for consistent red text styling.
- Guarded by `displayCategory` truthiness so no empty breadcrumb item or separator renders when category is missing.

**Change B — Badges row (line 1035)**
Remove:
```tsx
<span className="category-badge">{displayCategory}</span>
```
Keep `live-badge` and `breaking-badge` as-is.

**Change C — `displayCategory` variable (line 993)**
No change needed — already computes `article.category?.name || article.parentCategory?.name || ""`.

### 2. `client/src/components/User/ArticalDetails/ArticalDetails.css`

**Change A — Remove `.category-badge` styles (lines 100–110)**
Delete the entire `.article-page-wrapper .category-badge` block. This class becomes unused after removing the badge element.

**Change B — Add `.bc-link` category styling (optional)**
No new CSS is strictly required because `.bc-link` already renders red text (`color: #e60000`), bold font, and no text-decoration — matching the desired red-text category breadcrumb appearance without a background pill.

If a distinct category breadcrumb class is desired for future specificity, add:
```css
.article-page-wrapper .bc-link.bc-category {
  color: #e60000;
}
```
But this is optional since `.bc-link` alone satisfies the requirement.

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Article has category | Category name renders as red breadcrumb item, linked to `/category/${slug}` |
| Article has no category but has parentCategory | Parent category name renders as red breadcrumb item, linked to `/category/${parentCategory.slug}` |
| Article has neither | No category breadcrumb item or separator renders; breadcrumb goes Home → Title |
| Category has name but no slug | Category name renders as red plain-text span (not clickable) |

## Preserved Functionality
- Home breadcrumb navigation (`<Link to="/">`)
- Article title as final breadcrumb item
- Live badge and Breaking badge (unchanged)
- Article fetching, SEO metadata, comments, analytics, live updates, related news, ads, sidebar
- Preloader and 404 handling

## Verification Checklist
- [ ] Standalone `<span className="category-badge">` removed
- [ ] Category appears in breadcrumb after Home, before article title
- [ ] Category text is red (no background pill)
- [ ] Category uses actual article data (`article.category?.name || article.parentCategory?.name`)
- [ ] Category link uses actual slug (`article.category?.slug || article.parentCategory?.slug`)
- [ ] Missing category renders no empty breadcrumb item/separator
- [ ] Live and Breaking badges remain unaffected
- [ ] `npx tsc --noEmit` passes with zero errors

## No-Change Files
- `Preloder.tsx`, `Preloader.css` — untouched
- Other user pages using `Preloader` — untouched
- All other CSS classes — untouched except `.category-badge` removal
