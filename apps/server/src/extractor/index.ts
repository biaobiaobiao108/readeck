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

  // Pre-process DOM: handle lazy loading images and convert relative URLs to absolute
  const resolveUrl = (relative: string): string => {
    try {
      return new URL(relative, urlStr).toString();
    } catch {
      return relative;
    }
  };

  // Remove script tags and inline event handlers
  const scripts = document.querySelectorAll('script, noscript');
  scripts.forEach((s) => s.remove());

  // Clean elements and resolve relative links
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Handle images & lazy loading
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    const dataSrc =
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-actualsrc') ||
      img.getAttribute('data-url');

    const currentSrc = img.getAttribute('src');

    // If src is empty or a tiny placeholder (data:image or transparent gif) and lazy attribute exists
    if (dataSrc && (!currentSrc || currentSrc.startsWith('data:') || currentSrc.includes('placeholder'))) {
      img.setAttribute('src', dataSrc);
    }

    const finalSrc = img.getAttribute('src');
    if (finalSrc && !finalSrc.startsWith('data:')) {
      img.setAttribute('src', resolveUrl(finalSrc));
    }
  });

  // Resolve links
  const links = document.querySelectorAll('a');
  links.forEach((a) => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      a.setAttribute('href', resolveUrl(href));
    }
  });

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
