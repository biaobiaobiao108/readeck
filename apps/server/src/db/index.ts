import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Bookmark, BookmarkContent, BookmarkDetail, BookmarkListQuery, Tag, User } from '@readeck/shared';

export interface DbUserRow {
  id: number;
  uid: string;
  created: string;
  updated: string;
  last_login: string;
  username: string;
  email: string;
  password: string;
  group: 'admin' | 'user';
  settings: string;
}

export interface DbBookmarkRow {
  id: number;
  uid: string;
  user_id: number;
  created: string;
  updated: string;
  url: string;
  title: string;
  description: string;
  author: string;
  site_name: string;
  type: 'article' | 'photo' | 'video';
  is_archived: number;
  is_starred: number;
  is_marked: number;
  reading_time: number;
  word_count: number;
  thumbnail_url: string | null;
}

export class ReadeckDB {
  db: Database;

  constructor(dbPath: string = 'readeck.sqlite') {
    this.db = new Database(dbPath);
    this.db.run('PRAGMA journal_mode = WAL;');
    this.db.run('PRAGMA foreign_keys = ON;');
    this.initSchema();
  }

  private initSchema() {
    const schemaPath = join(import.meta.dir, 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf8');
    this.db.run(sql);
  }

  // --- Users ---
  getUserByUsername(username: string): DbUserRow | null {
    const query = this.db.query('SELECT * FROM user WHERE username = ? COLLATE NOCASE');
    return query.get(username) as DbUserRow | null;
  }

  getUserById(id: number): DbUserRow | null {
    const query = this.db.query('SELECT * FROM user WHERE id = ?');
    return query.get(id) as DbUserRow | null;
  }

  getUserCount(): number {
    const res = this.db.query('SELECT COUNT(*) as count FROM user').get() as { count: number };
    return res.count;
  }

  createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    group?: 'admin' | 'user';
  }): User {
    const uid = crypto.randomUUID();
    const now = new Date().toISOString();
    const group = data.group || 'user';

    const insert = this.db.query(`
      INSERT INTO user (uid, created, updated, last_login, username, email, password, \`group\`, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}')
    `);
    const res = insert.run(uid, now, now, now, data.username, data.email, data.passwordHash, group);
    const id = Number(res.lastInsertRowid);

    return {
      id,
      uid,
      created: now,
      updated: now,
      last_login: now,
      username: data.username,
      email: data.email,
      group,
      settings: {},
    };
  }

  updateLastLogin(userId: number): void {
    const now = new Date().toISOString();
    this.db.query('UPDATE user SET last_login = ? WHERE id = ?').run(now, userId);
  }

  // --- Tokens ---
  createToken(userId: number, tokenStr: string, appName: string = 'web'): void {
    const now = new Date().toISOString();
    this.db.query(`
      INSERT INTO token (uid, user_id, created, last_used, is_enabled, application, roles)
      VALUES (?, ?, ?, ?, 1, ?, '["*"]')
    `).run(tokenStr, userId, now, now, appName);
  }

  getUserByToken(tokenStr: string): DbUserRow | null {
    const query = this.db.query(`
      SELECT u.* FROM user u
      JOIN token t ON t.user_id = u.id
      WHERE t.uid = ? AND t.is_enabled = 1
    `);
    const user = query.get(tokenStr) as DbUserRow | null;
    if (user) {
      const now = new Date().toISOString();
      this.db.query('UPDATE token SET last_used = ? WHERE uid = ?').run(now, tokenStr);
    }
    return user;
  }

  deleteToken(tokenStr: string): void {
    this.db.query('DELETE FROM token WHERE uid = ?').run(tokenStr);
  }

  // --- Bookmarks ---
  createBookmark(params: {
    userId: number;
    url: string;
    title: string;
    description?: string;
    author?: string;
    siteName?: string;
    type?: 'article' | 'photo' | 'video';
    isArchived?: boolean;
    isStarred?: boolean;
    readingTime?: number;
    wordCount?: number;
    thumbnailUrl?: string;
    html?: string;
    text?: string;
    tags?: string[];
  }): BookmarkDetail {
    const uid = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertBookmark = this.db.query(`
      INSERT INTO bookmark (
        uid, user_id, created, updated, url, title, description,
        author, site_name, type, is_archived, is_starred, is_marked,
        reading_time, word_count, thumbnail_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);

    const res = insertBookmark.run(
      uid,
      params.userId,
      now,
      now,
      params.url,
      params.title,
      params.description || '',
      params.author || '',
      params.siteName || '',
      params.type || 'article',
      params.isArchived ? 1 : 0,
      params.isStarred ? 1 : 0,
      params.readingTime || 0,
      params.wordCount || 0,
      params.thumbnailUrl || null
    );

    const bookmarkId = Number(res.lastInsertRowid);

    // Insert content
    if (params.html || params.text) {
      this.db.query(`
        INSERT INTO bookmark_content (bookmark_id, html, text)
        VALUES (?, ?, ?)
      `).run(bookmarkId, params.html || '', params.text || '');
    }

    // Insert tags
    if (params.tags && params.tags.length > 0) {
      this.setBookmarkTags(bookmarkId, params.userId, params.tags);
    }

    return {
      id: bookmarkId,
      uid,
      user_id: params.userId,
      url: params.url,
      title: params.title,
      description: params.description || '',
      author: params.author || '',
      site_name: params.siteName || '',
      type: params.type || 'article',
      is_archived: !!params.isArchived,
      is_starred: !!params.isStarred,
      reading_time: params.readingTime || 0,
      word_count: params.wordCount || 0,
      created_at: now,
      updated_at: now,
      tags: (params.tags || []).map((t) => t.trim().toLowerCase()).sort(),
      content: params.html
        ? {
            id: 0,
            bookmark_id: bookmarkId,
            html: params.html,
            text: params.text || '',
          }
        : undefined,
    };
  }

  getBookmarks(userId: number, options: BookmarkListQuery = {}): { items: Bookmark[]; total: number } {
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const page = Math.max(1, options.page || 1);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['b.user_id = ?'];
    const args: (string | number)[] = [userId];

    if (options.status === 'unread') {
      conditions.push('b.is_archived = 0');
    } else if (options.status === 'archive') {
      conditions.push('b.is_archived = 1');
    } else if (options.status === 'favorite') {
      conditions.push('b.is_starred = 1');
    }

    if (options.search) {
      conditions.push('(b.title LIKE ? OR b.description LIKE ? OR b.url LIKE ?)');
      const term = `%${options.search}%`;
      args.push(term, term, term);
    }

    const tagFilter = options.tag || options.labels;
    if (tagFilter) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM bookmark_tag bt
          JOIN tag t ON t.id = bt.tag_id
          WHERE bt.bookmark_id = b.id AND t.name = ?
        )
      `);
      args.push(tagFilter);
    }

    if (options.url) {
      conditions.push('b.url = ?');
      args.push(options.url);
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countSql = `SELECT COUNT(*) as count FROM bookmark b WHERE ${whereClause}`;
    const totalRes = this.db.query(countSql).get(...args) as { count: number };
    const total = totalRes.count;

    // Items
    const sql = `
      SELECT b.* FROM bookmark b
      WHERE ${whereClause}
      ORDER BY b.created DESC
      LIMIT ? OFFSET ?
    `;
    const rows = this.db.query(sql).all(...args, limit, offset) as DbBookmarkRow[];

    const items = rows.map((row) => this.mapBookmarkRow(row));

    return { items, total };
  }

  getBookmarkById(userId: number, bookmarkId: number): BookmarkDetail | null {
    const row = this.db.query(`
      SELECT * FROM bookmark WHERE id = ? AND user_id = ?
    `).get(bookmarkId, userId) as DbBookmarkRow | null;

    if (!row) return null;

    const bookmark = this.mapBookmarkRow(row);
    const content = this.getBookmarkContent(bookmarkId);

    return {
      ...bookmark,
      content: content || undefined,
    };
  }

  getBookmarkContent(bookmarkId: number): BookmarkContent | null {
    const row = this.db.query(`
      SELECT * FROM bookmark_content WHERE bookmark_id = ?
    `).get(bookmarkId) as { id: number; bookmark_id: number; html: string; text: string } | null;

    return row || null;
  }

  updateBookmark(
    userId: number,
    bookmarkId: number,
    updates: {
      title?: string;
      description?: string;
      is_archived?: boolean;
      is_starred?: boolean;
      tags?: string[];
    }
  ): BookmarkDetail | null {
    const existing = this.getBookmarkById(userId, bookmarkId);
    if (!existing) return null;

    const setClauses: string[] = ['updated = ?'];
    const now = new Date().toISOString();
    const args: (string | number)[] = [now];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      args.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      args.push(updates.description);
    }
    if (updates.is_archived !== undefined) {
      setClauses.push('is_archived = ?');
      args.push(updates.is_archived ? 1 : 0);
    }
    if (updates.is_starred !== undefined) {
      setClauses.push('is_starred = ?');
      args.push(updates.is_starred ? 1 : 0);
    }

    args.push(bookmarkId, userId);
    this.db.query(`
      UPDATE bookmark SET ${setClauses.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...args);

    if (updates.tags !== undefined) {
      this.setBookmarkTags(bookmarkId, userId, updates.tags);
    }

    return this.getBookmarkById(userId, bookmarkId);
  }

  deleteBookmark(userId: number, bookmarkId: number): boolean {
    const res = this.db.query(`
      DELETE FROM bookmark WHERE id = ? AND user_id = ?
    `).run(bookmarkId, userId);
    return res.changes > 0;
  }

  // --- Tags ---
  getTags(userId: number): Tag[] {
    const rows = this.db.query(`
      SELECT t.id, t.name, COUNT(bt.bookmark_id) as count
      FROM tag t
      LEFT JOIN bookmark_tag bt ON bt.tag_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id, t.name
      ORDER BY count DESC, t.name ASC
    `).all(userId) as { id: number; name: string; count: number }[];

    return rows.map((r) => ({ id: r.id, name: r.name, count: r.count }));
  }

  setBookmarkTags(bookmarkId: number, userId: number, tags: string[]): void {
    // Clear current tags for this bookmark
    this.db.query('DELETE FROM bookmark_tag WHERE bookmark_id = ?').run(bookmarkId);

    for (const rawTag of tags) {
      const name = rawTag.trim().toLowerCase();
      if (!name) continue;

      // Ensure tag exists
      this.db.query(`
        INSERT INTO tag (user_id, name) VALUES (?, ?)
        ON CONFLICT(user_id, name) DO NOTHING
      `).run(userId, name);

      const tagRow = this.db.query(`
        SELECT id FROM tag WHERE user_id = ? AND name = ?
      `).get(userId, name) as { id: number };

      if (tagRow) {
        this.db.query(`
          INSERT OR IGNORE INTO bookmark_tag (bookmark_id, tag_id) VALUES (?, ?)
        `).run(bookmarkId, tagRow.id);
      }
    }
  }

  private mapBookmarkRow(row: DbBookmarkRow): Bookmark {
    const tagsRows = this.db.query(`
      SELECT t.name FROM tag t
      JOIN bookmark_tag bt ON bt.tag_id = t.id
      WHERE bt.bookmark_id = ?
      ORDER BY t.name ASC
    `).all(row.id) as { name: string }[];

    return {
      id: row.id,
      uid: row.uid,
      user_id: row.user_id,
      url: row.url,
      title: row.title,
      description: row.description,
      author: row.author,
      site_name: row.site_name,
      type: row.type,
      is_archived: row.is_archived === 1,
      is_starred: row.is_starred === 1,
      reading_time: row.reading_time,
      word_count: row.word_count,
      thumbnail_url: row.thumbnail_url || undefined,
      created_at: row.created,
      updated_at: row.updated,
      tags: tagsRows.map((t) => t.name),
    };
  }

  close(): void {
    this.db.close();
  }
}
