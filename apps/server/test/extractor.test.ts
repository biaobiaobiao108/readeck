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
});
