CREATE TABLE IF NOT EXISTS user (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uid         TEXT UNIQUE NOT NULL,
    created     DATETIME NOT NULL,
    updated     DATETIME NOT NULL,
    last_login  DATETIME NOT NULL,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    `group`     TEXT NOT NULL DEFAULT 'user',
    settings    TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS token (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uid         TEXT UNIQUE NOT NULL,
    user_id     INTEGER NOT NULL,
    created     DATETIME NOT NULL,
    last_used   DATETIME,
    expires     DATETIME,
    is_enabled  INTEGER NOT NULL DEFAULT 1,
    application TEXT NOT NULL,
    roles       TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmark (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    uid           TEXT UNIQUE NOT NULL,
    user_id       INTEGER NOT NULL,
    created       DATETIME NOT NULL,
    updated       DATETIME NOT NULL,
    url           TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    author        TEXT NOT NULL DEFAULT '',
    site_name     TEXT NOT NULL DEFAULT '',
    type          TEXT NOT NULL DEFAULT 'article',
    is_archived   INTEGER NOT NULL DEFAULT 0,
    is_starred    INTEGER NOT NULL DEFAULT 0,
    is_marked     INTEGER NOT NULL DEFAULT 0,
    reading_time  INTEGER NOT NULL DEFAULT 0,
    word_count    INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmark_content (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER UNIQUE NOT NULL,
    html        TEXT NOT NULL,
    text        TEXT NOT NULL,
    CONSTRAINT fk_content_bookmark FOREIGN KEY (bookmark_id) REFERENCES bookmark(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tag (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name    TEXT NOT NULL,
    UNIQUE(user_id, name),
    CONSTRAINT fk_tag_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmark_tag (
    bookmark_id INTEGER NOT NULL,
    tag_id      INTEGER NOT NULL,
    PRIMARY KEY (bookmark_id, tag_id),
    CONSTRAINT fk_bt_bookmark FOREIGN KEY (bookmark_id) REFERENCES bookmark(id) ON DELETE CASCADE,
    CONSTRAINT fk_bt_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmark(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_archived ON bookmark(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_bookmark_starred ON bookmark(user_id, is_starred);
