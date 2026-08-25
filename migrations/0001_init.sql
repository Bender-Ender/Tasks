-- Initial schema: categories, tasks, subtasks.
-- Character limits are enforced here as well as in the shared Zod schemas,
-- so a bad write cannot reach the database even if it bypasses the API layer.

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  color       TEXT NOT NULL,
  sort_order  REAL NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description  TEXT CHECK (description IS NULL OR length(description) <= 500),
  completed    INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  completed_at TEXT,
  deadline     TEXT,                                  -- 'YYYY-MM-DD'
  is_today     INTEGER NOT NULL DEFAULT 0 CHECK (is_today IN (0, 1)),
  category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  sort_order   REAL NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT                                   -- soft delete
);

CREATE TABLE subtasks (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 50),
  completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  sort_order REAL NOT NULL
);

CREATE INDEX idx_tasks_live     ON tasks (user_id, completed, deadline) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_today    ON tasks (user_id, is_today)            WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_category ON tasks (category_id);
CREATE INDEX idx_subtasks_task  ON subtasks (task_id);
CREATE INDEX idx_categories_user ON categories (user_id);
