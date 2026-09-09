import { Hono } from 'hono';
import type { ReadeckDB } from '../db/index.ts';
import { createAuthMiddleware } from '../middleware/auth.ts';
import { extractFromHtml, extractFromUrl } from '../extractor/index.ts';
import type { BookmarkListQuery, CreateBookmarkDTO, UpdateBookmarkDTO } from '@readeck/shared';
import type { AppEnv } from '../types.ts';

export function createBookmarksRouter(db: ReadeckDB) {
  const router = new Hono<AppEnv>();
  const requireAuth = createAuthMiddleware(db);

  router.use('*', requireAuth);

  // GET /api/bookmarks/labels (for browser extension autocomplete)
  router.get('/labels', (c) => {
    const user = c.get('user');
    const tags = db.getTags(user.id);
    return c.json(tags.map((t) => ({ name: t.name, count: t.count || 0 })));
  });

  // GET /api/bookmarks
  router.get('/', (c) => {
    const user = c.get('user');
    const query = c.req.query();

    const options: BookmarkListQuery = {
      status: (query.status as any) || (query.url ? undefined : 'unread'),
      tag: query.tag || query.labels,
      url: query.url,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };

    const result = db.getBookmarks(user.id, options);
    const hasMore = options.page! * options.limit! < result.total;

    return c.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: options.page,
        limit: options.limit,
        has_more: hasMore,
      },
    });
  });

  // POST /api/bookmarks
  router.post('/', async (c) => {
    const user = c.get('user');

    try {
      const body = (await c.req.json()) as CreateBookmarkDTO & { is_marked?: boolean };
      if (!body.url) {
        return c.json({ success: false, error: 'URL is required' }, 400);
      }

      // Check URL validity
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(body.url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return c.json({ success: false, error: 'Only http and https URLs are supported' }, 400);
        }
      } catch {
        return c.json({ success: false, error: 'Invalid URL' }, 400);
      }

      // Extract content: if extension provides raw DOM html, use it directly!
      let articleData;
      if (body.html && body.html.trim()) {
        try {
          articleData = extractFromHtml(body.html, body.url);
        } catch {
          articleData = {
            title: body.title || parsedUrl.hostname,
            description: '',
            author: '',
            site_name: parsedUrl.hostname.replace(/^www\./, ''),
            url: body.url,
            html: body.html,
            text: '',
            thumbnail_url: undefined,
            reading_time: 1,
            word_count: 0,
          };
        }
      } else {
        try {
          articleData = await extractFromUrl(body.url);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`Extraction failed for ${body.url}:`, errMsg);
          articleData = {
            title: body.title || parsedUrl.hostname,
            description: '',
            author: '',
            site_name: parsedUrl.hostname.replace(/^www\./, ''),
            url: body.url,
            html: '',
            text: '',
            thumbnail_url: undefined,
            reading_time: 1,
            word_count: 0,
          };
        }
      }

      const tags = body.labels || body.tags || [];
      const isStarred = body.is_starred !== undefined ? body.is_starred : body.is_marked || false;

      const bookmark = db.createBookmark({
        userId: user.id,
        url: body.url,
        title: body.title || articleData.title,
        description: articleData.description,
        author: articleData.author,
        siteName: articleData.site_name,
        type: 'article',
        isArchived: body.is_archived || false,
        isStarred,
        readingTime: articleData.reading_time,
        wordCount: articleData.word_count,
        thumbnailUrl: articleData.thumbnail_url,
        html: articleData.html,
        text: articleData.text,
        tags,
      });

      c.header('Bookmark-Id', bookmark.id.toString());
      return c.json({
        success: true,
        data: bookmark,
        id: bookmark.id,
        title: bookmark.title,
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  // GET /api/bookmarks/:id
  router.get('/:id', (c) => {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid bookmark ID' }, 400);
    }

    const bookmark = db.getBookmarkById(user.id, id);
    if (!bookmark) {
      return c.json({ success: false, error: 'Bookmark not found' }, 404);
    }

    return c.json({ success: true, data: bookmark });
  });

  // GET /api/bookmarks/:id/content
  router.get('/:id/content', (c) => {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid bookmark ID' }, 400);
    }

    const bookmark = db.getBookmarkById(user.id, id);
    if (!bookmark) {
      return c.json({ success: false, error: 'Bookmark not found' }, 404);
    }

    const content = db.getBookmarkContent(id);
    return c.json({
      success: true,
      data: content || {
        id: 0,
        bookmark_id: id,
        html: '',
        text: '',
      },
    });
  });

  // PATCH /api/bookmarks/:id
  router.patch('/:id', async (c) => {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid bookmark ID' }, 400);
    }

    try {
      const updates = (await c.req.json()) as UpdateBookmarkDTO;
      const updated = db.updateBookmark(user.id, id, updates);

      if (!updated) {
        return c.json({ success: false, error: 'Bookmark not found' }, 404);
      }

      return c.json({ success: true, data: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  // DELETE /api/bookmarks/:id
  router.delete('/:id', (c) => {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid bookmark ID' }, 400);
    }

    const deleted = db.deleteBookmark(user.id, id);
    if (!deleted) {
      return c.json({ success: false, error: 'Bookmark not found' }, 404);
    }

    return c.json({ success: true, message: 'Bookmark deleted successfully' });
  });

  return router;
}
