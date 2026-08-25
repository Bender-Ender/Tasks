import { useState } from 'react';
import { LIMITS, type Category, type Subtask, type Task } from '@shared/schema';
import { moveItem } from '@shared/order';
import { longDeadline } from '../lib/dates';
import { AutoField } from './AutoField';
import { Checkbox } from './TaskCard';
import { SortableList } from './SortableList';
import { Back, Calendar, Close, Drag, Panel, Plus, Sunrise, Trash } from './Icons';

interface Actions {
  updateTask: (patch: Partial<Task>) => void;
  deleteTask: () => void;
  addSubtask: (title: string) => void;
  updateSubtask: (id: string, patch: Partial<Subtask>) => void;
  deleteSubtask: (id: string) => void;
  reorderSubtasks: (items: { id: string; sortOrder: number }[]) => void;
}

export function TaskDetail({
  task,
  subtasks,
  categories,
  actions,
  onClose,
  onHidePane,
  variant,
}: {
  task: Task;
  subtasks: Subtask[];
  categories: Category[];
  actions: Actions;
  onClose: () => void;
  onHidePane?: () => void;
  variant: 'sheet' | 'pane';
}) {
  const [newSubtask, setNewSubtask] = useState('');
  const done = subtasks.filter((s) => s.completed).length;
  const category = categories.find((c) => c.id === task.categoryId);

  const submitSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtask.trim();
    if (!title) return;
    actions.addSubtask(title);
    setNewSubtask('');
  };

  return (
    <div className="bg-bg flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          {variant === 'sheet' ? (
            <button onClick={onClose} aria-label="Back to the list" className="text-muted flex size-11 items-center justify-center rounded-lg">
              <Back />
            </button>
          ) : (
            onHidePane && (
              <button
                onClick={onHidePane}
                className="border-line text-muted flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
              >
                <Panel /> Hide
                <kbd className="bg-sunk border-line rounded border px-1 py-px text-[10px] font-semibold">\</kbd>
              </button>
            )
          )}

          <button
            onClick={() => actions.updateTask({ isToday: !task.isToday })}
            aria-pressed={task.isToday}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              task.isToday ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sunk'
            }`}
          >
            <Sunrise size={16} />
            {task.isToday ? 'On Today' : 'Add to Today'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={actions.deleteTask}
            aria-label="Delete task"
            className="text-faint hover:text-overdue flex size-11 items-center justify-center rounded-lg"
          >
            <Trash size={18} />
          </button>
          {variant === 'pane' && (
            <button onClick={onClose} aria-label="Close" className="text-faint flex size-11 items-center justify-center rounded-lg">
              <Close size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-10 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-6">
          <AutoField
            label="Title"
            required
            value={task.title}
            maxLength={LIMITS.taskTitle}
            onCommit={(title) => actions.updateTask({ title })}
            className="font-display text-[27px] leading-tight font-medium tracking-tight sm:text-[33px]"
          />

          <AutoField
            label="Description"
            multiline
            value={task.description ?? ''}
            maxLength={LIMITS.description}
            placeholder="Anything worth remembering when you come back to this."
            onCommit={(description) => actions.updateTask({ description: description || null })}
            className="text-muted text-[14.5px] leading-relaxed"
          />

          <div className="border-line divide-line bg-surface divide-y overflow-hidden rounded-xl border">
            <Row icon={<Calendar />} label="Deadline">
              {/* Native date input: the OS picker is better than anything we
                  would build, and it is the same control on both platforms. */}
              <label className="relative flex cursor-pointer items-center gap-1.5">
                <span className={task.deadline ? 'font-medium' : 'text-faint'}>
                  {task.deadline ? longDeadline(task.deadline) : 'None'}
                </span>
                <input
                  type="date"
                  aria-label="Deadline"
                  value={task.deadline ?? ''}
                  onChange={(e) => actions.updateTask({ deadline: e.target.value || null })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              {task.deadline && (
                <button
                  onClick={() => actions.updateTask({ deadline: null })}
                  aria-label="Clear deadline"
                  className="text-faint hover:text-overdue relative z-10 -mr-1 flex size-8 items-center justify-center"
                >
                  <Close size={15} />
                </button>
              )}
            </Row>

            <Row
              icon={
                <span
                  className="size-[9px] rounded-full"
                  style={{ background: category?.color ?? 'var(--c-border-strong)' }}
                />
              }
              label="Category"
            >
              <div className="relative flex items-center gap-1.5">
                <span className={category ? 'font-medium' : 'text-faint'}>{category?.name ?? 'None'}</span>
                <select
                  aria-label="Category"
                  value={task.categoryId ?? ''}
                  onChange={(e) => actions.updateTask({ categoryId: e.target.value || null })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Row>
          </div>

          <section>
            <div className="mb-2.5 flex items-center gap-3">
              <h2 className="text-muted text-[11px] font-semibold tracking-[0.08em] uppercase">Sub-tasks</h2>
              <span className="bg-sunk h-1 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-accent block h-full transition-[width] duration-200"
                  style={{ width: subtasks.length ? `${(done / subtasks.length) * 100}%` : '0%' }}
                />
              </span>
              <span className="text-muted text-xs font-semibold tabular-nums">
                {done}/{subtasks.length}
              </span>
            </div>

            <div className="border-line bg-surface overflow-hidden rounded-xl border">
              <SortableList
                items={subtasks}
                className="divide-line divide-y"
                onMove={(from, to) => {
                  const change = moveItem(subtasks, from, to);
                  if (change) actions.reorderSubtasks([{ id: change.id, sortOrder: change.sortOrder }]);
                }}
              >
                {(s, { handle, dragging }) => (
                  <div className={`bg-surface flex min-h-12 items-center gap-2 pr-2 pl-2.5 ${dragging ? 'shadow-lg' : ''}`}>
                    <Checkbox
                      size="sm"
                      checked={s.completed}
                      label={`Complete ${s.title}`}
                      onChange={(completed) => actions.updateSubtask(s.id, { completed })}
                    />
                    <span className={`flex-1 text-[14.5px] ${s.completed ? 'text-faint line-through' : ''}`}>
                      {s.title}
                    </span>
                    <button
                      onClick={() => actions.deleteSubtask(s.id)}
                      aria-label={`Delete ${s.title}`}
                      className="text-faint hover:text-overdue flex size-9 items-center justify-center rounded-lg"
                    >
                      <Close size={15} />
                    </button>
                    <span {...handle} className="text-faint flex size-9 items-center justify-center">
                      <Drag size={15} />
                    </span>
                  </div>
                )}
              </SortableList>

              <form onSubmit={submitSubtask} className={`flex items-center gap-2 pr-2 pl-3.5 ${subtasks.length ? 'border-line border-t' : ''}`}>
                <Plus size={17} className="text-accent shrink-0" />
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  maxLength={LIMITS.subtaskTitle}
                  placeholder="Add sub-task"
                  aria-label="New sub-task"
                  className="placeholder:text-accent min-h-12 flex-1 bg-transparent text-[14.5px] font-medium outline-none"
                />
                {newSubtask.trim() && (
                  <span className="text-faint shrink-0 text-[11px] tabular-nums">
                    {newSubtask.length}/{LIMITS.subtaskTitle}
                  </span>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-13 items-center gap-3 px-3.5 text-[14.5px]">
      <span className="text-faint flex w-[17px] justify-center">{icon}</span>
      <span className="text-muted flex-1">{label}</span>
      {children}
    </div>
  );
}
