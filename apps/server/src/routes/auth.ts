import { Hono } from 'hono';
import type { ReadeckDB } from '../db/index.ts';
import { createAuthMiddleware } from '../middleware/auth.ts';
import type { AppEnv } from '../types.ts';

export function createAuthRouter(db: ReadeckDB) {
  const router = new Hono<AppEnv>();
  const requireAuth = createAuthMiddleware(db);

  router.post('/register', async (c) => {
    try {
      const body = await c.req.json();
      const { username, email, password } = body;

      if (!username || !email || !password) {
        return c.json({ success: false, error: 'Username, email and password are required' }, 400);
      }

      if (username.length < 3 || password.length < 6) {
        return c.json({ success: false, error: 'Username must be >= 3 chars, password >= 6 chars' }, 400);
      }

      const existing = db.getUserByUsername(username);
      if (existing) {
        return c.json({ success: false, error: 'Username already exists' }, 409);
      }

      const isFirstUser = db.getUserCount() === 0;
      const group = isFirstUser ? 'admin' : 'user';
      const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });

      const user = db.createUser({
        username,
        email,
        passwordHash,
        group,
      });

      const token = crypto.randomUUID();
      db.createToken(user.id, token, 'web');

      return c.json({
        success: true,
        data: {
          token,
          user,
        },
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  router.post('/login', async (c) => {
    try {
      const body = await c.req.json();
      const { username, password } = body;

      if (!username || !password) {
        return c.json({ success: false, error: 'Username and password are required' }, 400);
      }

      const user = db.getUserByUsername(username);
      if (!user) {
        return c.json({ success: false, error: 'Invalid username or password' }, 401);
      }

      const valid = await Bun.password.verify(password, user.password);
      if (!valid) {
        return c.json({ success: false, error: 'Invalid username or password' }, 401);
      }

      db.updateLastLogin(user.id);
      const token = crypto.randomUUID();
      db.createToken(user.id, token, 'web');

      return c.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            uid: user.uid,
            username: user.username,
            email: user.email,
            group: user.group,
            created: user.created,
            updated: user.updated,
            last_login: user.last_login,
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  router.get('/profile', requireAuth, (c) => {
    const user = c.get('user');
    return c.json({
      success: true,
      data: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        group: user.group,
        created: user.created,
        updated: user.updated,
        last_login: user.last_login,
      },
    });
  });

  router.post('/logout', requireAuth, (c) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      db.deleteToken(token);
    }
    return c.json({ success: true, message: 'Logged out successfully' });
  });

  return router;
}
