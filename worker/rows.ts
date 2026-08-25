import type { Category, Subtask, Task } from '@shared/schema';

/** SQLite stores booleans as 0/1 and has no null-vs-undefined distinction;
 *  these mappers are the only place that difference is dealt with. */

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  completed: number;
  completed_at: string | null;
  deadline: string | null;
  is_today: number;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  description: r.description,
  completed: r.completed === 1,
  completedAt: r.completed_at,
  deadline: r.deadline,
  isToday: r.is_today === 1,
  categoryId: r.category_id,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toSubtask = (r: SubtaskRow): Subtask => ({
  id: r.id,
  taskId: r.task_id,
  title: r.title,
  completed: r.completed === 1,
  sortOrder: r.sort_order,
});

export const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  color: r.color,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});
