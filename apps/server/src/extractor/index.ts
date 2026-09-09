import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import type { ExtractedArticle } from '@readeck/shared';

export async function extractFromUrl(url: string): Promise<ExtractedArticle> {
  const targetUrl = new URL(url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Readeck/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return extractFromHtml(html, targetUrl.toString());
}

export function extractFromHtml(html: string, urlStr: string): ExtractedArticle {
  const { document } = parseHTML(html);

  // Extract meta tags
  const getMeta = (names: string[]): string => {
    for (const name of names) {
      const el = document.querySelector(
        `meta[property="${name}"], meta[name="${name}"], meta[itemprop="${name}"]`
      );
      const content = el?.getAttribute('content');
      if (content && content.trim()) return content.trim();
    }
    return '';
  };

  const ogTitle = getMeta(['og:title', 'twitter:title']);
  const ogDescription = getMeta(['og:description', 'twitter:description', 'description']);
  const ogImage = getMeta(['og:image', 'twitter:image', 'image']);
  const ogSiteName = getMeta(['og:site_name', 'application-name']);
  const metaAuthor = getMeta(['author', 'article:author', 'twitter:creator']);

  // Extract article with Readability
  const reader = new Readability(document as unknown as Document);
  const article = reader.parse();

  const title = article?.title || ogTitle || document.title || 'Untitled';
  const author = article?.byline || metaAuthor || '';
  const description = article?.excerpt || ogDescription || '';
  const articleContent = article?.content || document.body?.innerHTML || '';
  const textContent = article?.textContent || document.body?.textContent || '';

  // Calculate word count & reading time
  const words = textContent.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Determine site name
  let siteName = ogSiteName || article?.siteName || '';
  if (!siteName) {
    try {
      siteName = new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      siteName = '';
    }
  }

  // Resolve thumbnail relative URL if needed
  let thumbnailUrl: string | undefined = ogImage || undefined;
  if (thumbnailUrl) {
    try {
      thumbnailUrl = new URL(thumbnailUrl, urlStr).toString();
    } catch {
      // Keep original or undefined
    }
  }

  return {
    title,
    description,
    author,
    site_name: siteName,
    url: urlStr,
    html: articleContent,
    text: textContent,
    thumbnail_url: thumbnailUrl,
    word_count: words,
    reading_time: readingTime,
  };
}
