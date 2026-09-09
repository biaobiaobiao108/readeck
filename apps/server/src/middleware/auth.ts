import type { Context, Next } from 'hono';
import type { ReadeckDB } from '../db/index.ts';
import type { AppEnv } from '../types.ts';

export function createAuthMiddleware(db: ReadeckDB) {
  return async (c: Context<AppEnv>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return c.json({ success: false, error: 'Invalid Authorization header format' }, 401);
    }

    const user = db.getUserByToken(token);
    if (!user) {
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    c.set('user', user);
    await next();
  };
}
