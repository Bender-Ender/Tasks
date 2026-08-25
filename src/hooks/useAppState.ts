import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AppState, Subtask, Task, UpdateSubtask, UpdateTask } from '@shared/schema';
import { orderAtEnd } from '@shared/order';
import { api, newId } from '../api';

const KEY = ['state'] as const;

/**
 * Every mutation follows the same shape: cancel in-flight refetches, snapshot
 * the cache, apply the change locally, roll back on failure, refetch when it
 * settles. The helper below keeps that from being written out eight times.
 */
function optimistic<Args>(qc: QueryClient, apply: (state: AppState, args: Args) => AppState) {
  return {
    onMutate: async (args: Args) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<AppState>(KEY);
      qc.setQueryData<AppState>(KEY, (s) => (s ? apply(s, args) : s));
      return { previous };
    },
    onError: (_err: unknown, _args: Args, ctx: { previous: AppState | undefined } | undefined) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  };
}

const patchTask = (s: AppState, id: string, patch: Partial<Task>): AppState => ({
  ...s,
  tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
});

export function useAppState() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: api.state });

  const createTask = useMutation({
    mutationFn: (input: { id: string; title: string } & Partial<Task>) => api.createTask(input),
    ...optimistic<{ id: string; title: string } & Partial<Task>>(qc, (s, input) => {
      const ts = new Date().toISOString();
      return {
        ...s,
        tasks: [
          ...s.tasks,
          {
            description: null,
            completed: false,
            completedAt: null,
            deadline: null,
            isToday: false,
            categoryId: null,
            sortOrder: orderAtEnd(s.tasks),
            createdAt: ts,
            updatedAt: ts,
            ...input,
          },
        ],
      };
    }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTask }) => api.updateTask(id, patch),
    ...optimistic<{ id: string; patch: UpdateTask }>(qc, (s, { id, patch }) =>
      patchTask(s, id, {
        ...(patch as Partial<Task>),
        // completed_at moves with the flag, same as the server does it, so the
        // optimistic cache matches what comes back.
        ...('completed' in patch ? { completedAt: patch.completed ? new Date().toISOString() : null } : {}),
      }),
    ),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    ...optimistic<string>(qc, (s, id) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
      subtasks: s.subtasks.filter((st) => st.taskId !== id),
    })),
  });

  /** Undo for a delete. The row is only soft-deleted, so this is a real
   *  restore rather than a re-create with a new id. */
  const restoreTask = useMutation({
    mutationFn: (id: string) => api.restoreTask(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });

  const createSubtask = useMutation({
    mutationFn: ({ taskId, id, title }: { taskId: string; id: string; title: string }) =>
      api.createSubtask(taskId, { id, title }),
    ...optimistic<{ taskId: string; id: string; title: string }>(qc, (s, { taskId, id, title }) => ({
      ...s,
      subtasks: [
        ...s.subtasks,
        { id, taskId, title, completed: false, sortOrder: orderAtEnd(s.subtasks.filter((x) => x.taskId === taskId)) },
      ],
    })),
  });

  const updateSubtask = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateSubtask }) => api.updateSubtask(id, patch),
    ...optimistic<{ id: string; patch: UpdateSubtask }>(qc, (s, { id, patch }) => ({
      ...s,
      subtasks: s.subtasks.map((st) => (st.id === id ? { ...st, ...(patch as Partial<Subtask>) } : st)),
    })),
  });

  const deleteSubtask = useMutation({
    mutationFn: (id: string) => api.deleteSubtask(id),
    ...optimistic<string>(qc, (s, id) => ({ ...s, subtasks: s.subtasks.filter((st) => st.id !== id) })),
  });

  const reorderSubtasks = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      Promise.all(items.map((i) => api.updateSubtask(i.id, { sortOrder: i.sortOrder }))),
    ...optimistic<{ id: string; sortOrder: number }[]>(qc, (s, items) => {
      const moved = new Map(items.map((i) => [i.id, i.sortOrder]));
      return { ...s, subtasks: s.subtasks.map((st) => (moved.has(st.id) ? { ...st, sortOrder: moved.get(st.id)! } : st)) };
    }),
  });

  return {
    ...query,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    newId,
  };
}
