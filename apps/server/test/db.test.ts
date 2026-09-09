import { describe, expect, it } from 'bun:test';
import { ReadeckDB } from '../src/db/index.ts';

describe('ReadeckDB', () => {
  const db = new ReadeckDB(':memory:');

  it('should create and retrieve a user', () => {
    const user = db.createUser({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hashed_pw_test',
      group: 'admin',
    });

    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBe('admin');
    expect(user.email).toBe('admin@example.com');
    expect(user.group).toBe('admin');

    const found = db.getUserByUsername('admin');
    expect(found).not.toBeNull();
    expect(found?.username).toBe('admin');

    const count = db.getUserCount();
    expect(count).toBe(1);
  });

  it('should handle auth tokens', () => {
    const user = db.getUserByUsername('admin')!;
    const token = 'test-token-uuid-123';
    db.createToken(user.id, token, 'test-app');

    const tokenUser = db.getUserByToken(token);
    expect(tokenUser).not.toBeNull();
    expect(tokenUser?.id).toBe(user.id);

    db.deleteToken(token);
    expect(db.getUserByToken(token)).toBeNull();
  });

  it('should create, list, and filter bookmarks', () => {
    const user = db.getUserByUsername('admin')!;

    const bm1 = db.createBookmark({
      userId: user.id,
      url: 'https://example.com/article-1',
      title: 'First Article',
      description: 'A test article',
      html: '<p>Content for article 1</p>',
      text: 'Content for article 1',
      tags: ['tech', 'news'],
      isArchived: false,
      isStarred: true,
    });

    expect(bm1.id).toBeGreaterThan(0);
    expect(bm1.title).toBe('First Article');
    expect(bm1.tags).toEqual(['news', 'tech']); // sorted
    expect(bm1.is_starred).toBe(true);

    const bm2 = db.createBookmark({
      userId: user.id,
      url: 'https://example.com/article-2',
      title: 'Second Article',
      html: '<p>Content for article 2</p>',
      isArchived: true,
      tags: ['tech'],
    });

    // Unread
    const unread = db.getBookmarks(user.id, { status: 'unread' });
    expect(unread.items.length).toBe(1);
    expect(unread.items[0].id).toBe(bm1.id);

    // Archive
    const archived = db.getBookmarks(user.id, { status: 'archive' });
    expect(archived.items.length).toBe(1);
    expect(archived.items[0].id).toBe(bm2.id);

    // Starred
    const starred = db.getBookmarks(user.id, { status: 'favorite' });
    expect(starred.items.length).toBe(1);
    expect(starred.items[0].id).toBe(bm1.id);

    // Tag filter
    const newsTag = db.getBookmarks(user.id, { tag: 'news' });
    expect(newsTag.items.length).toBe(1);

    // Tags list
    const tags = db.getTags(user.id);
    expect(tags.some((t) => t.name === 'tech')).toBe(true);
    expect(tags.some((t) => t.name === 'news')).toBe(true);

    // Content
    const content = db.getBookmarkContent(bm1.id);
    expect(content?.html).toContain('Content for article 1');
  });

  it('should update and delete bookmarks', () => {
    const user = db.getUserByUsername('admin')!;
    const bm = db.createBookmark({
      userId: user.id,
      url: 'https://example.com/update-test',
      title: 'Original Title',
    });

    const updated = db.updateBookmark(user.id, bm.id, {
      title: 'Updated Title',
      is_starred: true,
      tags: ['updated'],
    });

    expect(updated?.title).toBe('Updated Title');
    expect(updated?.is_starred).toBe(true);
    expect(updated?.tags).toEqual(['updated']);

    const deleted = db.deleteBookmark(user.id, bm.id);
    expect(deleted).toBe(true);

    const notFound = db.getBookmarkById(user.id, bm.id);
    expect(notFound).toBeNull();
  });
});
