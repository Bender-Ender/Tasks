import { useCallback, useEffect, useState } from 'react';
import { LIMITS, type Task } from '@shared/schema';
import { useAppState } from './hooks/useAppState';
import { useToast } from './hooks/useToasts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TaskCard } from './components/TaskCard';
import { TaskDetail } from './components/TaskDetail';
import { Plus } from './components/Icons';

/** Above this the detail sits beside the list; below it, it covers the screen. */
const PANE_LAYOUT = '(min-width: 1024px)';

export function App() {
  const state = useAppState();
  const toast = useToast();
  const twoPane = useMediaQuery(PANE_LAYOUT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const close = useCallback(() => setSelectedId(null), []);

  // On a phone the detail fills the screen, so the hardware/gesture back must
  // close it rather than leaving the app.
  useEffect(() => {
    if (!selectedId || twoPane) return;
    window.history.pushState({ detail: selectedId }, '');
    const onPop = () => setSelectedId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [selectedId, twoPane]);

  const dismiss = useCallback(() => {
    if (!twoPane && window.history.state?.detail) window.history.back();
    else close();
  }, [twoPane, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, dismiss]);

  if (state.isPending) return <Centred>Loading…</Centred>;
  if (state.error) return <Centred>{state.error.message}</Centred>;

  const { tasks, subtasks, categories } = state.data;
  const open = tasks.filter((t) => !t.completed).sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const subtasksOf = (id: string) => subtasks.filter((s) => s.taskId === id).sort((a, b) => a.sortOrder - b.sortOrder);

  const complete = (task: Task, completed: boolean) => {
    state.updateTask.mutate({ id: task.id, patch: { completed } });
    if (completed) {
      toast.show(`Completed “${task.title}”`, () =>
        state.updateTask.mutate({ id: task.id, patch: { completed: false } }),
      );
    }
  };

  const remove = (task: Task) => {
    state.deleteTask.mutate(task.id);
    if (selectedId === task.id) dismiss();
    toast.show(`Deleted “${task.title}”`, () => state.restoreTask.mutate(task.id));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    state.createTask.mutate({ id: state.newId(), title });
    setDraft('');
  };

  const detail = selected && (
    <TaskDetail
      key={selected.id}
      task={selected}
      subtasks={subtasksOf(selected.id)}
      categories={categories}
      variant={twoPane ? 'pane' : 'sheet'}
      onClose={dismiss}
      actions={{
        updateTask: (patch) => state.updateTask.mutate({ id: selected.id, patch }),
        deleteTask: () => remove(selected),
        addSubtask: (title) => state.createSubtask.mutate({ taskId: selected.id, id: state.newId(), title }),
        updateSubtask: (id, patch) => state.updateSubtask.mutate({ id, patch }),
        deleteSubtask: (id) => state.deleteSubtask.mutate(id),
        reorderSubtasks: (items) => state.reorderSubtasks.mutate(items),
      }}
    />
  );

  const list = (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-2 lg:px-6 lg:pt-7">
        <h1 className="font-display text-4xl leading-none font-medium tracking-tight lg:text-[29px]">Tasks</h1>
        <p className="text-muted mt-2 text-xs">
          {open.length === 0 ? 'Nothing open' : `${open.length} open`}
          {tasks.length > open.length && ` · ${tasks.length - open.length} done`}
        </p>
      </header>

      <form onSubmit={add} className="flex shrink-0 gap-2 px-5 py-3 lg:px-6">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={LIMITS.taskTitle}
          placeholder="Add a task"
          aria-label="New task"
          className="border-line bg-surface placeholder:text-faint focus:border-accent min-h-11 flex-1 rounded-xl border px-3.5 text-[15px] outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="bg-accent text-accent-ink flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-opacity disabled:opacity-30"
        >
          <Plus size={17} />
          Add
        </button>
      </form>

      <div className="flex-1 overflow-y-auto px-5 pb-24 lg:px-6 lg:pb-8">
        {open.length === 0 ? (
          <p className="text-faint py-16 text-center text-sm">Nothing open. Add something above.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {open.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  category={categories.find((c) => c.id === task.categoryId)}
                  subtasks={subtasksOf(task.id)}
                  selected={twoPane && task.id === selectedId}
                  onOpen={() => setSelectedId(task.id)}
                  onComplete={(next) => complete(task, next)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (twoPane) {
    return (
      <div className="grid h-full grid-cols-[minmax(360px,428px)_minmax(0,1fr)]">
        <div className="border-line min-w-0 border-r">{list}</div>
        <div className="min-w-0">
          {detail ?? (
            <div className="text-faint flex h-full items-center justify-center px-8 text-center text-sm">
              Pick a task to see its details.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full max-w-xl">
      {list}
      {detail && <div className="bg-bg fixed inset-0 z-40">{detail}</div>}
    </div>
  );
}

const Centred = ({ children }: { children: React.ReactNode }) => (
  <div className="text-muted flex h-full items-center justify-center px-6 text-center text-sm">{children}</div>
);
