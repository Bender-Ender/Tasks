import { Hono } from 'hono';
import { z } from 'zod';
import {
  type AppState,
  BulkTaskUpdate,
  CreateCategory,
  CreateSubtask,
  CreateTask,
  ReorderTasks,
  UpdateCategory,
  UpdateSubtask,
  UpdateTask,
} from '@shared/schema';
import { userIdFrom } from './auth';
import { toCategory, toSubtask, toTask, type CategoryRow, type SubtaskRow, type TaskRow } from './rows';

interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
}

type Ctx = { Bindings: Env; Variables: { userId: string } };

const app = new Hono<Ctx>();

app.use('/api/*', async (c, next) => {
  c.set('userId', userIdFrom(c.req.raw, c.env.ENVIRONMENT === 'production'));
  await next();
});

/** Parse a JSON body against a schema, answering 400 with the field errors. */
async function body<S extends z.ZodType>(c: { req: { json(): Promise<unknown> } }, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HttpError(400, 'expected a JSON body');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, z.prettifyError(parsed.error));
  return parsed.data;
}

class HttpError extends Error {
  constructor(readonly status: 400 | 404, message: string) {
    super(message);
  }
}

const now = () => new Date().toISOString();

/* ------------------------------------------------------------- hydrate */

async function loadState(db: D1Database, userId: string): Promise<AppState> {
  const [tasks, subtasks, categories] = await Promise.all([
    db
      .prepare(
        `SELECT id, title, description, completed, completed_at, deadline, is_today,
                category_id, sort_order, created_at, updated_at
           FROM tasks WHERE user_id = ? AND deleted_at IS NULL
          ORDER BY sort_order`,
      )
      .bind(userId)
      .all<TaskRow>(),
    db
      .prepare(
        `SELECT s.id, s.task_id, s.title, s.completed, s.sort_order
           FROM subtasks s JOIN tasks t ON t.id = s.task_id
          WHERE t.user_id = ? AND t.deleted_at IS NULL
          ORDER BY s.sort_order`,
      )
      .bind(userId)
      .all<SubtaskRow>(),
    db
      .prepare(`SELECT id, name, color, sort_order, created_at FROM categories WHERE user_id = ? ORDER BY sort_order`)
      .bind(userId)
      .all<CategoryRow>(),
  ]);

  return {
    tasks: tasks.results.map(toTask),
    subtasks: subtasks.results.map(toSubtask),
    categories: categories.results.map(toCategory),
  };
}

app.get('/api/state', async (c) => c.json(await loadState(c.env.DB, c.get('userId'))));

/* --------------------------------------------------------------- tasks */

app.post('/api/tasks', async (c) => {
  const input = await body(c, CreateTask);
  const userId = c.get('userId');
  const ts = now();

  const sortOrder =
    input.sortOrder ??
    (await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1024 AS next FROM tasks WHERE user_id = ? AND deleted_at IS NULL`,
    )
      .bind(userId)
      .first<{ next: number }>())!.next;

  await c.env.DB.prepare(
    `INSERT INTO tasks (id, user_id, title, description, completed, deadline, is_today,
                        category_id, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      input.id,
      userId,
      input.title,
      input.description ?? null,
      input.deadline ?? null,
      input.isToday ? 1 : 0,
      input.categoryId ?? null,
      sortOrder,
      ts,
      ts,
    )
    .run();

  return c.json(await mustGetTask(c.env.DB, userId, input.id), 201);
});

/** Column names are from this fixed map, never from request data. */
const TASK_COLUMNS = {
  title: (v: unknown) => v,
  description: (v: unknown) => v,
  completed: (v: unknown) => (v ? 1 : 0),
  deadline: (v: unknown) => v,
  isToday: (v: unknown) => (v ? 1 : 0),
  categoryId: (v: unknown) => v,
  sortOrder: (v: unknown) => v,
} as const;

const COLUMN_OF: Record<keyof typeof TASK_COLUMNS, string> = {
  title: 'title',
  description: 'description',
  completed: 'completed',
  deadline: 'deadline',
  isToday: 'is_today',
  categoryId: 'category_id',
  sortOrder: 'sort_order',
};

app.patch('/api/tasks/:id', async (c) => {
  const patch = await body(c, UpdateTask);
  const userId = c.get('userId');
  const id = c.req.param('id');
  const ts = now();

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of Object.keys(TASK_COLUMNS) as (keyof typeof TASK_COLUMNS)[]) {
    if (!(key in patch)) continue;
    sets.push(`${COLUMN_OF[key]} = ?`);
    values.push(TASK_COLUMNS[key]((patch as Record<string, unknown>)[key]));
  }

  // completed_at tracks the flag so the "done in the last 7 days" section has
  // something to filter on.
  if ('completed' in patch) {
    sets.push('completed_at = ?');
    values.push(patch.completed ? ts : null);
  }
  if (sets.length === 0) throw new HttpError(400, 'no fields to update');

  sets.push('updated_at = ?');
  values.push(ts, id, userId);

  const res = await c.env.DB.prepare(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(...values)
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'task not found');
  return c.json(await mustGetTask(c.env.DB, userId, id));
});

app.post('/api/tasks/bulk', async (c) => {
  const { ids, patch } = await body(c, BulkTaskUpdate);
  const userId = c.get('userId');
  const ts = now();

  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.isToday !== undefined) {
    sets.push('is_today = ?');
    values.push(patch.isToday ? 1 : 0);
  }
  if (patch.completed !== undefined) {
    sets.push('completed = ?', 'completed_at = ?');
    values.push(patch.completed ? 1 : 0, patch.completed ? ts : null);
  }
  sets.push('updated_at = ?');
  values.push(ts);

  const holes = ids.map(() => '?').join(', ');
  await c.env.DB.prepare(
    `UPDATE tasks SET ${sets.join(', ')} WHERE user_id = ? AND deleted_at IS NULL AND id IN (${holes})`,
  )
    .bind(...values, userId, ...ids)
    .run();

  return c.json({ updated: ids.length });
});

app.post('/api/tasks/reorder', async (c) => {
  const { items } = await body(c, ReorderTasks);
  const userId = c.get('userId');
  const ts = now();

  await c.env.DB.batch(
    items.map((i) =>
      c.env.DB.prepare(`UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?`).bind(
        i.sortOrder,
        ts,
        i.id,
        userId,
      ),
    ),
  );
  return c.json({ reordered: items.length });
});

/** Soft delete; a purge of anything older than 30 days happens at Phase 5. */
app.delete('/api/tasks/:id', async (c) => {
  const res = await c.env.DB.prepare(
    `UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  )
    .bind(now(), now(), c.req.param('id'), c.get('userId'))
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'task not found');
  return c.body(null, 204);
});

app.post('/api/tasks/:id/restore', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const res = await c.env.DB.prepare(
    `UPDATE tasks SET deleted_at = NULL, updated_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
  )
    .bind(now(), id, userId)
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'task not found');
  return c.json(await mustGetTask(c.env.DB, userId, id));
});

/* ------------------------------------------------------------ subtasks */

app.post('/api/tasks/:id/subtasks', async (c) => {
  const input = await body(c, CreateSubtask);
  const taskId = c.req.param('id');
  await mustGetTask(c.env.DB, c.get('userId'), taskId); // 404s if it is not yours

  const sortOrder =
    input.sortOrder ??
    (await c.env.DB.prepare(`SELECT COALESCE(MAX(sort_order), 0) + 1024 AS next FROM subtasks WHERE task_id = ?`)
      .bind(taskId)
      .first<{ next: number }>())!.next;

  await c.env.DB.prepare(`INSERT INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, 0, ?)`)
    .bind(input.id, taskId, input.title, sortOrder)
    .run();

  const row = await c.env.DB.prepare(`SELECT id, task_id, title, completed, sort_order FROM subtasks WHERE id = ?`)
    .bind(input.id)
    .first<SubtaskRow>();
  return c.json(toSubtask(row!), 201);
});

app.patch('/api/subtasks/:id', async (c) => {
  const patch = await body(c, UpdateSubtask);
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.title !== undefined) (sets.push('title = ?'), values.push(patch.title));
  if (patch.completed !== undefined) (sets.push('completed = ?'), values.push(patch.completed ? 1 : 0));
  if (patch.sortOrder !== undefined) (sets.push('sort_order = ?'), values.push(patch.sortOrder));

  const res = await c.env.DB.prepare(
    `UPDATE subtasks SET ${sets.join(', ')}
      WHERE id = ? AND task_id IN (SELECT id FROM tasks WHERE user_id = ? AND deleted_at IS NULL)`,
  )
    .bind(...values, c.req.param('id'), c.get('userId'))
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'subtask not found');
  const row = await c.env.DB.prepare(`SELECT id, task_id, title, completed, sort_order FROM subtasks WHERE id = ?`)
    .bind(c.req.param('id'))
    .first<SubtaskRow>();
  return c.json(toSubtask(row!));
});

app.delete('/api/subtasks/:id', async (c) => {
  const res = await c.env.DB.prepare(
    `DELETE FROM subtasks
      WHERE id = ? AND task_id IN (SELECT id FROM tasks WHERE user_id = ? AND deleted_at IS NULL)`,
  )
    .bind(c.req.param('id'), c.get('userId'))
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'subtask not found');
  return c.body(null, 204);
});

/* ---------------------------------------------------------- categories */

app.post('/api/categories', async (c) => {
  const input = await body(c, CreateCategory);
  const userId = c.get('userId');
  const sortOrder =
    input.sortOrder ??
    (await c.env.DB.prepare(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE user_id = ?`)
      .bind(userId)
      .first<{ next: number }>())!.next;

  await c.env.DB.prepare(`INSERT INTO categories (id, user_id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(input.id, userId, input.name, input.color, sortOrder, now())
    .run();

  const row = await c.env.DB.prepare(`SELECT id, name, color, sort_order, created_at FROM categories WHERE id = ?`)
    .bind(input.id)
    .first<CategoryRow>();
  return c.json(toCategory(row!), 201);
});

app.patch('/api/categories/:id', async (c) => {
  const patch = await body(c, UpdateCategory);
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.name !== undefined) (sets.push('name = ?'), values.push(patch.name));
  if (patch.color !== undefined) (sets.push('color = ?'), values.push(patch.color));
  if (patch.sortOrder !== undefined) (sets.push('sort_order = ?'), values.push(patch.sortOrder));

  const res = await c.env.DB.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values, c.req.param('id'), c.get('userId'))
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'category not found');
  const row = await c.env.DB.prepare(`SELECT id, name, color, sort_order, created_at FROM categories WHERE id = ?`)
    .bind(c.req.param('id'))
    .first<CategoryRow>();
  return c.json(toCategory(row!));
});

/** Tasks in the category survive — the FK is ON DELETE SET NULL. */
app.delete('/api/categories/:id', async (c) => {
  const res = await c.env.DB.prepare(`DELETE FROM categories WHERE id = ? AND user_id = ?`)
    .bind(c.req.param('id'), c.get('userId'))
    .run();

  if (res.meta.changes === 0) throw new HttpError(404, 'category not found');
  return c.body(null, 204);
});

/* -------------------------------------------------------------- export */

app.get('/api/export', async (c) => {
  const state = await loadState(c.env.DB, c.get('userId'));
  return c.json(state, 200, {
    'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().slice(0, 10)}.json"`,
  });
});

/* --------------------------------------------------------------- plumb */

async function mustGetTask(db: D1Database, userId: string, id: string) {
  const row = await db
    .prepare(
      `SELECT id, title, description, completed, completed_at, deadline, is_today,
              category_id, sort_order, created_at, updated_at
         FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .bind(id, userId)
    .first<TaskRow>();
  if (!row) throw new HttpError(404, 'task not found');
  return toTask(row);
}

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: 'internal error' }, 500);
});

export default app;
