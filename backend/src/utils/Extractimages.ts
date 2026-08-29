// server/src/utils/extractImages.ts

export function extractImagesFromContent(content: string): string[] {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const urls: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}