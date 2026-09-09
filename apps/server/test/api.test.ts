import { describe, expect, it } from 'bun:test';
import { app } from '../src/index.ts';

describe('Server API Routes', () => {
  let token = '';
  const username = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const email = `${username}@example.com`;

  it('GET /api/health should return ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.runtime).toBe('bun');
  });

  it('POST /api/auth/register should create user and return token', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password: 'password123',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.username).toBe(username);

    token = body.data.token;
  });

  it('POST /api/auth/login should authenticate user', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password: 'password123',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it('GET /api/profile should return current user profile', async () => {
    const res = await app.request('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe(username);
  });

  it('GET /api/bookmarks requires auth', async () => {
    const res = await app.request('/api/bookmarks');
    expect(res.status).toBe(401);
  });

  it('POST & GET /api/bookmarks should create and list bookmarks', async () => {
    const createRes = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://bun.sh/blog/bun-v1.0',
        title: 'Bun 1.0 Release',
        tags: ['bun', 'javascript'],
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.success).toBe(true);
    expect(created.data.id).toBeDefined();
    const bookmarkId = created.data.id;

    // List bookmarks
    const listRes = await app.request('/api/bookmarks?status=unread', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.data.items.length).toBeGreaterThan(0);

    // Update bookmark (archive it)
    const patchRes = await app.request(`/api/bookmarks/${bookmarkId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_archived: true,
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.data.is_archived).toBe(true);

    // List archived bookmarks
    const archivedRes = await app.request('/api/bookmarks?status=archive', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(archivedRes.status).toBe(200);
    const archivedList = await archivedRes.json();
    expect(archivedList.data.items.some((b: any) => b.id === bookmarkId)).toBe(true);

    // Delete bookmark
    const deleteRes = await app.request(`/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status).toBe(200);
  });

  it('GET / should serve index.html with SPA fallback', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Readeck');
    expect(text).toContain('<div id="root"></div>');
  });

  it('GET /index.css should serve compiled CSS', async () => {
    const res = await app.request('/index.css');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  describe('Browser Extension Compatibility', () => {
    it('GET /api/info should return Readeck version and features', async () => {
      const res = await app.request('/api/info');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.version).toBeDefined();
      expect(data.version.release).toBe('0.17.0');
    });

    it('GET /api/profile should authenticate extension token and return user profile', async () => {
      const res = await app.request('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe(username);
      expect(data.provider).toBeDefined();
      expect(data.provider.name).toBe('bearer token');
    });

    it('POST /api/bookmarks should support extension payload with labels and captured html', async () => {
      const extensionPayload = {
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        title: 'JavaScript Docs',
        labels: ['firefox', 'docs'],
        html: `
          <html>
            <head><title>JavaScript Docs</title></head>
            <body>
              <article>
                <h1>JavaScript Docs</h1>
                <p>JavaScript is a lightweight interpreted programming language.</p>
              </article>
            </body>
          </html>
        `,
      };

      const res = await app.request('/api/bookmarks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extensionPayload),
      });

      expect(res.status).toBe(201);
      expect(res.headers.get('Bookmark-Id')).toBeDefined();
      const body = await res.json();
      expect(body.title).toBe('JavaScript Docs');

      // Check url filter
      const checkRes = await app.request(`/api/bookmarks?url=${encodeURIComponent(extensionPayload.url)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(checkRes.status).toBe(200);
      const list = await checkRes.json();
      expect(list.data.items.length).toBe(1);

      // Check labels list
      const labelsRes = await app.request('/api/bookmarks/labels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(labelsRes.status).toBe(200);
      const labels = await labelsRes.json();
      expect(Array.isArray(labels)).toBe(true);
      expect(labels.some((l: any) => l.name === 'firefox')).toBe(true);
    });
  });
});

