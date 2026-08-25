import { z } from 'zod';

/** Field limits. Mirrored by CHECK constraints in migrations/0001_init.sql
 *  and by maxLength on the inputs, so a value can only be wrong in one place. */
export const LIMITS = {
  taskTitle: 100,
  description: 500,
  subtaskTitle: 50,
  categoryName: 40,
} as const;

const id = z.string().min(1).max(64);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const isoDateTime = z.iso.datetime();
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'expected #rrggbb');

/* ------------------------------------------------------------- entities */

export const Category = z.object({
  id,
  name: z.string().trim().min(1).max(LIMITS.categoryName),
  color: hexColor,
  sortOrder: z.number(),
  createdAt: isoDateTime,
});

export const Subtask = z.object({
  id,
  taskId: id,
  title: z.string().trim().min(1).max(LIMITS.subtaskTitle),
  completed: z.boolean(),
  sortOrder: z.number(),
});

export const Task = z.object({
  id,
  title: z.string().trim().min(1).max(LIMITS.taskTitle),
  description: z.string().max(LIMITS.description).nullable(),
  completed: z.boolean(),
  completedAt: isoDateTime.nullable(),
  deadline: isoDate.nullable(),
  /** Sticky manual flag. Nothing clears it but the user. */
  isToday: z.boolean(),
  categoryId: id.nullable(),
  sortOrder: z.number(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const AppState = z.object({
  tasks: z.array(Task),
  subtasks: z.array(Subtask),
  categories: z.array(Category),
});

/* ------------------------------------------------------------- payloads */

/** The client mints the id so an optimistic create keeps its identity. */
export const CreateTask = Task.pick({ id: true, title: true }).extend({
  description: Task.shape.description.optional(),
  deadline: Task.shape.deadline.optional(),
  isToday: z.boolean().optional(),
  categoryId: Task.shape.categoryId.optional(),
  sortOrder: z.number().optional(),
});

export const UpdateTask = Task.omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'no fields to update');

export const CreateSubtask = Subtask.pick({ id: true, title: true }).extend({
  sortOrder: z.number().optional(),
});

export const UpdateSubtask = Subtask.pick({ title: true, completed: true, sortOrder: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'no fields to update');

/** Multi-select planning pass: flag or unflag several tasks in one round trip. */
export const BulkTaskUpdate = z.object({
  ids: z.array(id).min(1).max(200),
  patch: z.object({ isToday: z.boolean().optional(), completed: z.boolean().optional() })
    .refine((v) => Object.keys(v).length > 0, 'no fields to update'),
});

export const ReorderTasks = z.object({
  items: z.array(z.object({ id, sortOrder: z.number() })).min(1).max(500),
});

export const CreateCategory = Category.pick({ id: true, name: true, color: true }).extend({
  sortOrder: z.number().optional(),
});

export const UpdateCategory = Category.pick({ name: true, color: true, sortOrder: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'no fields to update');

/* ---------------------------------------------------------------- types */

export type Category = z.infer<typeof Category>;
export type Subtask = z.infer<typeof Subtask>;
export type Task = z.infer<typeof Task>;
export type AppState = z.infer<typeof AppState>;
export type CreateTask = z.infer<typeof CreateTask>;
export type UpdateTask = z.infer<typeof UpdateTask>;
export type CreateSubtask = z.infer<typeof CreateSubtask>;
export type UpdateSubtask = z.infer<typeof UpdateSubtask>;
export type BulkTaskUpdate = z.infer<typeof BulkTaskUpdate>;
export type ReorderTasks = z.infer<typeof ReorderTasks>;
export type CreateCategory = z.infer<typeof CreateCategory>;
export type UpdateCategory = z.infer<typeof UpdateCategory>;
