import { AppState, type CreateTask, type UpdateTask } from '@shared/schema';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error((detail as { error?: string } | null)?.error ?? `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  /** Single hydrate call; everything else patches the cache optimistically. */
  state: async (): Promise<AppState> => AppState.parse(await request('/api/state')),

  createTask: (input: CreateTask) => request('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),

  updateTask: (id: string, patch: UpdateTask) =>
    request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

  bulkTasks: (ids: string[], patch: { isToday?: boolean; completed?: boolean }) =>
    request('/api/tasks/bulk', { method: 'POST', body: JSON.stringify({ ids, patch }) }),
};

export const newId = () => crypto.randomUUID();
