const fs = require('fs');

// Fix ArticalDetails.tsx
const articalFile = 'D:\\news-website\\client\\src\\components\\User\\ArticalDetails\\ArticalDetails.tsx';
let content = fs.readFileSync(articalFile, 'utf8');

// Remove getArticleUrl helper function
const startIdx = content.indexOf('// ─── Helper: getArticleUrl');
const endIdx = content.indexOf('// ─── Poll Component');
if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + '\n\n' + content.slice(endIdx);
}

// Add totalComments calculation before displayCategory
content = content.replace(
  'const displayCategory = article.category',
  'const totalComments = comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0);\n  const displayCategory = article.category'
);

fs.writeFileSync('D:\\news-website\\client\\src\\components\\User\\ArticalDetails\\ArticalDetails.tsx', content);
console.log('Fixed ArticalDetails.tsx');

// Fix CategoryShowcase.tsx
const categoryFile = 'D:\\news-website\\client\\src\\components\\User\\CategoryShowcase\\CategoryShowcase.tsx';
let catContent = fs.readFileSync(categoryFile, 'utf8');

// Remove duplicate LAYOUT_STYLES declaration (second occurrence)
const firstLayoutIdx = catContent.indexOf('const LAYOUT_STYLES = [');
const secondLayoutIdx = catContent.indexOf('const LAYOUT_STYLES = [', catContent.indexOf('const LAYOUT_STYLES = [') + 1);
if (secondLayoutIdx !== -1) {
  const endIdx = catContent.indexOf('];', secondLayoutIdx) + 2;
  catContent = catContent.slice(0, secondLayoutIdx) + catContent.slice(endIdx);
}

// Fix _id property access - change article._id to article.id where appropriate
catContent = catContent.replace(/article\._id/g, 'article.id');

fs.writeFileSync(categoryFile, catContent);
console.log('Fixed CategoryShowcase.tsx');

// Fix HomeHero.tsx
const homeHeroFile = 'D:\\news-website\\client\\src\\components\\User\\HomeHero\\HomeHero.tsx';
let homeContent = fs.readFileSync(homeHeroFile, 'utf8');

// Remove unused imports: ChevronLeft, ChevronRight
homeContent = homeContent.replace(
  'import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";',
  'import { Clock, Eye } from "lucide-react";'
);

// Remove unused variables declarations
homeContent = homeContent.replace(/const \[isOverflowing, setIsOverflowing\] = useState\(false\);/g, '');
homeContent = homeContent.replace(/const \[tagsScrollRef\] = useRef<HTMLDivElement>\(null\);/g, '');
homeContent = homeContent.replace(/const \[isOverflowing, setIsOverflowing\] = useState\(false\);/g, '');

// Remove the checkOverflow and scrollTags functions and related useEffects
// Find and remove the checkOverflow function and related code
const checkOverflowStart = homeContent.indexOf('// 👇 EXPERT FIX: State to track if tags are overflowing the screen');
const checkOverflowEnd = homeContent.indexOf('}, []);', checkOverflowStart);
if (checkOverflowStart !== -1 && checkOverflowEnd !== -1) {
  const endPos = homeContent.indexOf('\n', checkOverflowEnd) + 1;
  homeContent = homeContent.slice(0, checkOverflowStart) + homeContent.slice(endPos);
}

// Remove scrollTags function
const scrollTagsStart = homeContent.indexOf('// 👇 EXPERT FIX: Scroll functions for the tags carousel');
const scrollTagsEnd = homeContent.indexOf('};', scrollTagsStart);
if (scrollTagsStart !== -1 && scrollTagsEnd !== -1) {
  const endPos = homeContent.indexOf('\n', scrollTagsEnd) + 1;
  homeContent = homeContent.slice(0, scrollTagsStart) + homeContent.slice(endPos);
}

// Remove keyboard handler useEffect
const keyboardStart = homeContent.indexOf('// 👇 EXPERT FIX: Handle keyboard navigation for accessibility');
const keyboardEnd = homeContent.indexOf('}, []);', keyboardStart);
if (keyboardStart !== -1 && keyboardEnd !== -1) {
  const endPos = homeContent.indexOf('\n', keyboardEnd) + 1;
  homeContent = homeContent.slice(0, keyboardStart) + homeContent.slice(endPos);
}

// Remove unused LAYOUT_STYLES constant
const layoutStylesStart = homeContent.indexOf('const LAYOUT_STYLES = [');
const layoutStylesEnd = homeContent.indexOf('];', layoutStylesStart);
if (layoutStylesStart !== -1 && layoutStylesEnd !== -1) {
  const endPos = homeContent.indexOf('\n', layoutStylesEnd) + 1;
  homeContent = homeContent.slice(0, layoutStylesStart) + homeContent.slice(endPos);
}

// Fix category display - use categoryId?.name instead of category
homeContent = homeContent.replace(/\{featuredArticle\.category\}/g, '{featuredArticle.categoryId?.name ?? "NEWS"}');

// Fix the featured article link - remove IIFE and use direct URL
const featuredStart = homeContent.indexOf('{featuredArticle && (');
const featuredEnd = homeContent.indexOf('}))}', homeContent.indexOf('}))}', homeContent.indexOf('{featuredArticle && (')) + 3);
if (featuredStart !== -1 && featuredEnd !== -1) {
  // Replace the IIFE with direct URL logic
  const featuredSection = homeContent.slice(featuredStart, featuredEnd);
  const newFeaturedSection = `{featuredArticle && (
            (() => {
              const featuredUrl = featuredArticle.slug
                ? \`/news/\${featuredArticle.slug}\`
                : featuredArticle.id || featuredArticle._id
                  ? \`/article/\${featuredArticle.id || featuredArticle._id}\`
                  : null;
              if (!featuredUrl) return null;
              return (
                <Link
                  to={featuredUrl}
                  className="featured-article text-decoration-none"
                >
                  <img
                    src={
                      featuredArticle.featuredImage ||
                      PLACEHOLDER_IMG_LARGE
                    }
                    alt={featuredArticle.headline}
                    className="featured-bg-img"
                  />
                  <div className="featured-overlay">
                    <div className="featured-badges">
                      <StatusBadge
                        articleType={featuredArticle.articleType}
                        statusType={featuredArticle.statusType}
                        variant="default"
                      />
                      <span className="category-badge politics">
                        {featuredArticle.categoryId?.name || "NEWS"}
                      </span>
                    </div>
                    <h1 className="featured-title">
                      {featuredArticle.headline}
                    </h1>

                    <p className="featured-excerpt">
                      {featuredArticle.excerpt ||
                        "No description available."}
                    </p>

                    <div className="featured-meta">
                      <span>
                        <Clock size={16} />
                        {featuredArticle.createdAt
                          ? new Date(
                              featuredArticle.createdAt
                            ).toLocaleDateString()
                          : "Recently"}
                      </span>

                      <span>
                        <Eye size={16} />
                        {featuredArticle.views || 0} views
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })()}`;
  homeContent = homeContent.slice(0, featuredStart) + newFeaturedSection + homeContent.slice(featuredEnd);
}

fs.writeFileSync(homeHeroFile, homeContent);
console.log('Fixed HomeHero.tsx');

console.log('All fixes applied');