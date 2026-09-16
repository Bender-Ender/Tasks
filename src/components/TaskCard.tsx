import type { Category, Subtask, Task } from '@shared/schema';
import { shortDeadline, urgencyOf } from '../lib/dates';
import { playTickSound } from '../lib/sound';
import { Check, Chevron } from './Icons';

export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  const box = size === 'md' ? 'size-[21px] rounded-md' : 'size-[18px] rounded-[5px]';
  return (
    // The 44px tap target is bigger than the visible box and is pulled back
    // into the layout with negative margins, so touch is comfortable without
    // the card growing around it.
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        // Every checkbox in the app is this one, so completing anything —
        // task or sub-task, list or detail — sounds the same. Only on the way
        // in: un-ticking is a correction, not an achievement.
        if (!checked) playTickSound();
        onChange(!checked);
      }}
      className="flex size-11 shrink-0 items-center justify-center"
    >
      <span
        className={`${box} flex items-center justify-center border-[1.5px] transition-colors ${
          checked ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-transparent'
        }`}
      >
        <Check size={size === 'md' ? 13 : 11} />
      </span>
    </button>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="text-muted flex items-center gap-1.5 text-xs font-medium">
      <span className="size-[7px] shrink-0 rounded-full" style={{ background: category.color }} />
      {category.name}
    </span>
  );
}

export function DeadlineChip({ deadline }: { deadline: string }) {
  const urgency = urgencyOf(deadline);
  const tone =
    urgency === 'overdue'
      ? 'bg-overdue-soft text-overdue border-transparent'
      : urgency === 'today'
        ? 'bg-soon-soft text-soon border-transparent'
        : 'bg-sunk text-muted border-line';
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium ${tone}`}>
      {shortDeadline(deadline)}
    </span>
  );
}

export function TaskCard({
  task,
  category,
  subtasks,
  selected,
  expanded,
  dragging,
  onOpen,
  onComplete,
  onToggleSubtask,
  trailing,
}: {
  task: Task;
  category?: Category;
  subtasks: Subtask[];
  selected?: boolean;
  expanded?: boolean;
  dragging?: boolean;
  onOpen: () => void;
  onComplete: (next: boolean) => void;
  onToggleSubtask?: (id: string, completed: boolean) => void;
  trailing?: React.ReactNode;
}) {
  const done = subtasks.filter((s) => s.completed).length;
  const hasMeta = category || task.deadline || subtasks.length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`bg-surface group flex w-full gap-3 rounded-xl border p-3.5 text-left transition-colors ${
        selected ? 'border-accent ring-accent ring-1' : 'border-line hover:border-line-strong'
      } ${dragging ? 'shadow-lg' : ''}`}
    >
      <Checkbox checked={task.completed} onChange={onComplete} label={`Complete ${task.title}`} />

      <div className="-my-1 min-w-0 flex-1">
        <p className={`text-[15.5px] leading-snug font-medium ${task.completed ? 'text-faint line-through' : ''}`}>
          {task.title}
        </p>

        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category && <CategoryTag category={category} />}
            {task.deadline && <DeadlineChip deadline={task.deadline} />}
            {subtasks.length > 0 && (
              <span className="bg-sunk border-line text-muted rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium tabular-nums">
                {done}/{subtasks.length}
              </span>
            )}
          </div>
        )}

        {expanded && subtasks.length > 0 && (
          <ul className="border-line mt-2.5 flex flex-col border-t border-dashed pt-2">
            {subtasks.map((s) => (
              <li key={s.id} className="flex min-h-[34px] items-center gap-2">
                <Checkbox
                  size="sm"
                  checked={s.completed}
                  label={`Complete ${s.title}`}
                  onChange={(next) => onToggleSubtask?.(s.id, next)}
                />
                <span className={`text-[13.5px] ${s.completed ? 'text-faint line-through' : ''}`}>{s.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {trailing ?? <Chevron size={15} className="text-faint mt-1 shrink-0 sm:hidden" />}
    </div>
  );
}
