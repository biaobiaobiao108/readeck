import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { ReadeckDB } from './db/index.ts';
import { createAuthRouter } from './routes/auth.ts';
import { createBookmarksRouter } from './routes/bookmarks.ts';
import { createTagsRouter } from './routes/tags.ts';

import { createAuthMiddleware } from './middleware/auth.ts';
import type { AppEnv } from './types.ts';

const dbPath = process.env.DATABASE_PATH || 'readeck.sqlite';
export const db = new ReadeckDB(dbPath);

export const app = new Hono<AppEnv>();

app.use('*', logger());
app.use('*', cors());

const requireAuth = createAuthMiddleware(db);

// Standard Readeck info endpoint (used by browser extension on setup)
app.get('/api/info', (c) => {
  return c.json({
    version: {
      release: '0.17.0',
      canonical: '0.17.0',
      build: '',
    },
    features: ['bookmarks', 'labels'],
  });
});

// Standard Readeck profile endpoint (used by browser extension to verify token)
app.get('/api/profile', requireAuth, (c) => {
  const user = c.get('user');
  let userSettings = {};
  try {
    userSettings = JSON.parse(user.settings || '{}');
  } catch {
    userSettings = {};
  }

  return c.json({
    user: {
      username: user.username,
      email: user.email,
      created: user.created,
      updated: user.updated,
      settings: userSettings,
    },
    provider: {
      name: 'bearer token',
      id: user.uid,
      application: 'extension',
      roles: ['*'],
      permissions: ['*'],
    },
    id: user.id,
    uid: user.uid,
    username: user.username,
    email: user.email,
    group: user.group,
  });
});

// Mount API routes
app.route('/api/auth', createAuthRouter(db));
app.route('/api/bookmarks', createBookmarksRouter(db));
app.route('/api/tags', createTagsRouter(db));

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', runtime: 'bun', time: new Date().toISOString() });
});

// Static assets & SPA fallback
const distDir = join(import.meta.dir, '../../web/dist');

app.get('*', async (c) => {
  const urlPath = c.req.path;
  if (urlPath.startsWith('/api')) {
    return c.json({ success: false, error: 'API route not found' }, 404);
  }

  const relPath = urlPath.replace(/^\//, '');
  if (relPath) {
    const requestedFile = join(distDir, relPath);
    if (existsSync(requestedFile) && statSync(requestedFile).isFile()) {
      return new Response(Bun.file(requestedFile));
    }
  }

  // SPA fallback to index.html
  const indexPath = join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    return new Response(Bun.file(indexPath), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return c.text('Readeck Bun Server is running. (Web UI dist not built yet. Run `bun run build` to build frontend)', 200);
});

const PORT = parseInt(process.env.PORT || '8000', 10);

if (import.meta.main) {
  console.log(`🚀 Readeck Bun Server listening on http://localhost:${PORT}`);
}

export default {
  port: PORT,
  fetch: app.fetch,
};
