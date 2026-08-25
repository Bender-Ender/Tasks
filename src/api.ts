import {
  AppState,
  type Category,
  type CreateCategory,
  type CreateSubtask,
  type CreateTask,
  type Subtask,
  type Task,
  type UpdateCategory,
  type UpdateSubtask,
  type UpdateTask,
} from '@shared/schema';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const api = {
  /** Single hydrate call; every mutation patches the cache optimistically. */
  state: async (): Promise<AppState> => AppState.parse(await request('/api/state')),

  createTask: (input: CreateTask) => request<Task>('/api/tasks', json('POST', input)),
  updateTask: (id: string, patch: UpdateTask) => request<Task>(`/api/tasks/${id}`, json('PATCH', patch)),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  restoreTask: (id: string) => request<Task>(`/api/tasks/${id}/restore`, { method: 'POST' }),

  bulkTasks: (ids: string[], patch: { isToday?: boolean; completed?: boolean }) =>
    request<{ updated: number }>('/api/tasks/bulk', json('POST', { ids, patch })),

  reorderTasks: (items: { id: string; sortOrder: number }[]) =>
    request<{ reordered: number }>('/api/tasks/reorder', json('POST', { items })),

  createSubtask: (taskId: string, input: CreateSubtask) =>
    request<Subtask>(`/api/tasks/${taskId}/subtasks`, json('POST', input)),
  updateSubtask: (id: string, patch: UpdateSubtask) =>
    request<Subtask>(`/api/subtasks/${id}`, json('PATCH', patch)),
  deleteSubtask: (id: string) => request<void>(`/api/subtasks/${id}`, { method: 'DELETE' }),

  createCategory: (input: CreateCategory) => request<Category>('/api/categories', json('POST', input)),
  updateCategory: (id: string, patch: UpdateCategory) =>
    request<Category>(`/api/categories/${id}`, json('PATCH', patch)),
  deleteCategory: (id: string) => request<void>(`/api/categories/${id}`, { method: 'DELETE' }),
};

export const newId = () => crypto.randomUUID();
