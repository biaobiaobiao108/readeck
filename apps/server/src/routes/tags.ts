import { Hono } from 'hono';
import type { ReadeckDB } from '../db/index.ts';
import { createAuthMiddleware } from '../middleware/auth.ts';
import type { AppEnv } from '../types.ts';

export function createTagsRouter(db: ReadeckDB) {
  const router = new Hono<AppEnv>();
  const requireAuth = createAuthMiddleware(db);

  router.use('*', requireAuth);

  router.get('/', (c) => {
    const user = c.get('user');
    const tags = db.getTags(user.id);
    return c.json({ success: true, data: tags });
  });

  return router;
}
