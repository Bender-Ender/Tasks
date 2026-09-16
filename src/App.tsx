import { useCallback, useEffect, useState } from 'react';
import { LIMITS, type Category, type Task } from '@shared/schema';
import { useAppState } from './hooks/useAppState';
import { useToast } from './hooks/useToasts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TaskCard } from './components/TaskCard';
import { TaskDetail } from './components/TaskDetail';
import { CategoryEditor } from './components/CategoryEditor';
import { Plus } from './components/Icons';
import { CategoryChips, Sidebar, TabBar, viewTitle, type View } from './components/Nav';

/** Above this the detail sits beside the list; below it, it covers the screen. */
const PANE_LAYOUT = '(min-width: 1024px)';

export function App() {
  const state = useAppState();
  const toast = useToast();
  const twoPane = useMediaQuery(PANE_LAYOUT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  // Real data has no isToday flags yet, so defaulting to Today would open onto
  // an empty app. All tasks is the view that is never surprising.
  const [view, setView] = useState<View>({ kind: 'all' });

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
      // The category editor owns Escape while it is open, so this does not
      // also close the detail pane underneath it on desktop.
      if (e.key === 'Escape' && selectedId && !categoryEditorOpen) dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, dismiss, categoryEditorOpen]);

  if (state.isPending) return <Centred>Loading…</Centred>;
  if (state.error) return <Centred>{state.error.message}</Centred>;

  const { tasks, subtasks, categories } = state.data;
  const open = tasks.filter((t) => !t.completed).sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const subtasksOf = (id: string) => subtasks.filter((s) => s.taskId === id).sort((a, b) => a.sortOrder - b.sortOrder);

  // Counts are always of open work, so a category that is entirely done reads
  // as 0 rather than quietly disagreeing with "Nothing open" in the list.
  const todayCount = open.filter((t) => t.isToday).length;
  const categoryCounts = new Map(categories.map((c) => [c.id, open.filter((t) => t.categoryId === c.id).length]));

  const inView = (t: Task) => {
    if (view.kind === 'today') return t.isToday;
    if (view.kind === 'category') return t.categoryId === view.id;
    return true;
  };
  const visible = open.filter(inView);
  const doneInView = tasks.filter((t) => t.completed && inView(t)).length;

  const emptyCopy =
    view.kind === 'today'
      ? 'Nothing flagged for today. Open a task and add it to Today.'
      : view.kind === 'category'
        ? `No open tasks in ${viewTitle(view, categories)}.`
        : 'Nothing open. Add something above.';

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

  // Categories are hard-deleted (no restore endpoint), so there is no undo —
  // just a confirmation, already given by CategoryEditor before this runs.
  const removeCategory = (category: Category) => {
    state.deleteCategory.mutate(category.id);
    if (view.kind === 'category' && view.id === category.id) setView({ kind: 'all' });
    toast.show(`Deleted “${category.name}”`);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    // A task added while filtered would otherwise vanish the moment it is
    // created, so it inherits whatever filter it was created under.
    const defaults = view.kind === 'today' ? { isToday: true } : view.kind === 'category' ? { categoryId: view.id } : {};
    state.createTask.mutate({ id: state.newId(), title, ...defaults });
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
        <h1 className="font-display text-4xl leading-none font-medium tracking-tight lg:text-[29px]">
          {viewTitle(view, categories)}
        </h1>
        <p className="text-muted mt-2 text-xs">
          {visible.length === 0 ? 'Nothing open' : `${visible.length} open`}
          {doneInView > 0 && ` · ${doneInView} done`}
        </p>
      </header>

      {!twoPane && view.kind !== 'today' && (
        <CategoryChips view={view} categories={categories} onSelect={setView} onManage={() => setCategoryEditorOpen(true)} />
      )}

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

      <div className="flex-1 overflow-y-auto px-5 pb-28 lg:px-6 lg:pb-8">
        {visible.length === 0 ? (
          <p className="text-faint py-16 text-center text-sm">{emptyCopy}</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {visible.map((task) => (
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

  const categoryEditor = categoryEditorOpen && (
    <CategoryEditor
      categories={categories}
      tasks={tasks}
      newId={state.newId}
      onClose={() => setCategoryEditorOpen(false)}
      actions={{
        onCreate: (input) => state.createCategory.mutate(input),
        onRename: (id, name) => state.updateCategory.mutate({ id, patch: { name } }),
        onRecolor: (id, color) => state.updateCategory.mutate({ id, patch: { color } }),
        onDelete: removeCategory,
      }}
    />
  );

  if (twoPane) {
    return (
      <div className="grid h-full grid-cols-[220px_minmax(360px,428px)_minmax(0,1fr)]">
        <Sidebar
          view={view}
          onSelect={setView}
          todayCount={todayCount}
          allCount={open.length}
          categories={categories}
          categoryCounts={categoryCounts}
          onManageCategories={() => setCategoryEditorOpen(true)}
        />
        <div className="border-line min-w-0 border-r">{list}</div>
        <div className="min-w-0">
          {detail ?? (
            <div className="text-faint flex h-full items-center justify-center px-8 text-center text-sm">
              Pick a task to see its details.
            </div>
          )}
        </div>
        {categoryEditor}
      </div>
    );
  }

  return (
    <div className="mx-auto h-full max-w-xl">
      {list}
      {!selectedId && <TabBar view={view} onSelect={setView} />}
      {detail && <div className="bg-bg fixed inset-0 z-40">{detail}</div>}
      {categoryEditor}
    </div>
  );
}

const Centred = ({ children }: { children: React.ReactNode }) => (
  <div className="text-muted flex h-full items-center justify-center px-6 text-center text-sm">{children}</div>
);
