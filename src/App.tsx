import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LIMITS, type AppState } from '@shared/schema';
import { api, newId } from './api';

/**
 * Phase 0 scaffold: proves the whole path end to end — Vite → Worker → D1 →
 * back into an optimistically-updated cache. The real UI from the mockups
 * lands in Phase 1; this deliberately stays small.
 */
export function App() {
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ['state'], queryFn: api.state });
  const [draft, setDraft] = useState('');

  const patchCache = (fn: (s: AppState) => AppState) =>
    qc.setQueryData<AppState>(['state'], (s) => (s ? fn(s) : s));

  const create = useMutation({
    mutationFn: api.createTask,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const previous = qc.getQueryData<AppState>(['state']);
      const ts = new Date().toISOString();
      patchCache((s) => ({
        ...s,
        tasks: [
          ...s.tasks,
          {
            id: input.id,
            title: input.title,
            description: null,
            completed: false,
            completedAt: null,
            deadline: null,
            isToday: false,
            categoryId: null,
            sortOrder: Number.MAX_SAFE_INTEGER,
            createdAt: ts,
            updatedAt: ts,
          },
        ],
      }));
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['state'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['state'] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => api.updateTask(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ['state'] });
      const previous = qc.getQueryData<AppState>(['state']);
      patchCache((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed } : t)) }));
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['state'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['state'] }),
  });

  if (isPending) return <Centred>Loading…</Centred>;
  if (error) return <Centred>{error.message}</Centred>;

  const open = data.tasks.filter((t) => !t.completed);
  const byId = new Map(data.categories.map((c) => [c.id, c]));

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col px-5">
      <header className="pt-13 pb-3">
        <h1 className="font-display text-4xl leading-none font-medium tracking-tight">Today</h1>
        <p className="text-muted mt-2 text-xs">
          {open.length} open · {data.tasks.length - open.length} done · {data.categories.length} categories
        </p>
      </header>

      <form
        className="flex gap-2 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          const title = draft.trim();
          if (!title) return;
          create.mutate({ id: newId(), title });
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={LIMITS.taskTitle}
          placeholder="Add a task"
          className="border-line bg-surface placeholder:text-faint focus:border-accent min-h-11 flex-1 rounded-xl border px-3.5 text-[15px] outline-none"
        />
        <button
          type="submit"
          className="bg-accent text-accent-ink min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-40"
          disabled={!draft.trim()}
        >
          Add
        </button>
      </form>

      <ul className="flex flex-col gap-2.5 pb-8">
        {open.map((task) => {
          const category = task.categoryId ? byId.get(task.categoryId) : undefined;
          const subs = data.subtasks.filter((s) => s.taskId === task.id);
          return (
            <li key={task.id} className="border-line bg-surface flex gap-3 rounded-xl border p-3.5">
              <button
                aria-label={`Complete ${task.title}`}
                onClick={() => toggle.mutate({ id: task.id, completed: true })}
                className="-my-3 -ml-3 flex size-11 items-center justify-center"
              >
                <span className="border-line-strong block size-5 rounded-md border-[1.5px]" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] leading-snug font-medium">{task.title}</p>
                {(category || subs.length > 0) && (
                  <div className="text-muted mt-2 flex items-center gap-2.5 text-xs font-medium">
                    {category && (
                      <span className="flex items-center gap-1.5">
                        <span className="size-[7px] rounded-full" style={{ background: category.color }} />
                        {category.name}
                      </span>
                    )}
                    {subs.length > 0 && (
                      <span className="bg-sunk border-line rounded-md border px-1.5 py-0.5 tabular-nums">
                        {subs.filter((s) => s.completed).length}/{subs.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {open.length === 0 && <li className="text-faint py-10 text-center text-sm">Nothing open.</li>}
      </ul>
    </div>
  );
}

const Centred = ({ children }: { children: React.ReactNode }) => (
  <div className="text-muted flex h-full items-center justify-center text-sm">{children}</div>
);
