import { describe, expect, it } from 'bun:test';
import { extractFromHtml } from '../src/extractor/index.ts';

describe('Article Extractor', () => {
  it('should parse metadata and article content from HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Article Title - MyBlog</title>
          <meta property="og:title" content="Open Graph Title" />
          <meta property="og:description" content="This is a summary of the article." />
          <meta property="og:image" content="https://example.com/cover.jpg" />
          <meta property="og:site_name" content="TechNotes" />
          <meta name="author" content="Alice Smith" />
        </head>
        <body>
          <header>
            <nav><a href="/">Home</a></nav>
          </header>
          <main>
            <article>
              <h1>Open Graph Title</h1>
              <p class="byline">By Alice Smith</p>
              <p>Bun is an incredibly fast all-in-one JavaScript runtime and toolkit.</p>
              <p>It includes a bundler, test runner, package manager, and native SQLite support.</p>
              <p>Migrating full-stack applications to Bun offers significant performance improvements.</p>
            </article>
          </main>
          <footer>
            <p>Copyright 2026</p>
          </footer>
        </body>
      </html>
    `;

    const result = extractFromHtml(html, 'https://example.com/post/bun-guide');

    expect(result.title).toBe('Open Graph Title');
    expect(result.site_name).toBe('TechNotes');
    expect(result.thumbnail_url).toBe('https://example.com/cover.jpg');
    expect(result.html).toContain('Bun is an incredibly fast all-in-one JavaScript runtime');
    expect(result.word_count).toBeGreaterThan(10);
    expect(result.reading_time).toBeGreaterThanOrEqual(1);
  });

  it('should convert relative URLs to absolute and handle lazy loaded images', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Lazy & Relative Test</title></head>
        <body>
          <article>
            <h1>Lazy & Relative Test</h1>
            <p>Here is an article with relative resources and lazy loading images.</p>
            <p><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="/assets/photo.jpg" alt="Photo" /></p>
            <p><img src="images/banner.png" alt="Banner" /></p>
            <p>Visit <a href="/docs/guide.html">the guide</a> for more info.</p>
            <script>alert('malicious')</script>
            <div onclick="evil()">Click me</div>
          </article>
        </body>
      </html>
    `;

    const result = extractFromHtml(html, 'https://example.com/blog/article');

    expect(result.html).toContain('src="https://example.com/assets/photo.jpg"');
    expect(result.html).toContain('src="https://example.com/blog/images/banner.png"');
    expect(result.html).toContain('href="https://example.com/docs/guide.html"');
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('alert');
    expect(result.html).not.toContain('onclick');
  });
});

