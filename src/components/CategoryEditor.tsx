import { useEffect, useRef, useState } from 'react';
import { LIMITS, type Category, type Task } from '@shared/schema';
import { Check, Close, Pencil, Plus, Trash } from './Icons';

/** A small fixed palette rather than a free picker, so every category stays
 *  in the app's muted register. The first five are the seeded categories'
 *  own colours (migrations/0002_seed_categories.sql); the rest fill the gaps
 *  in hue at the same saturation/lightness so new picks still fit in. All
 *  read clearly as small dots on both the light and dark surface tokens. */
const CATEGORY_COLORS = [
  '#4A6FB8', // blue
  '#8B5FA8', // purple
  '#2E8267', // green
  '#A8722E', // amber
  '#5E7080', // slate
  '#B8567A', // rose
  '#2E8A8C', // teal
  '#8C7A2E', // mustard
] as const;

interface Actions {
  onCreate: (input: { id: string; name: string; color: string }) => void;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, color: string) => void;
  onDelete: (category: Category) => void;
}

/** The one category editor, opened as an overlay from both the desktop
 *  sidebar and the phone chip row. Only mounted while open, which also gives
 *  us mount/unmount as the hook for capturing and restoring focus. */
export function CategoryEditor({
  categories,
  tasks,
  actions,
  onClose,
  newId,
}: {
  categories: Category[];
  tasks: Task[];
  actions: Actions;
  onClose: () => void;
  newId: () => string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Return focus to whatever opened us — the trigger button still has focus
  // at mount time, so this is enough without threading a ref through.
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => trigger?.focus?.();
  }, []);

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    actions.onCreate({ id: newId(), name, color: newColor });
    setNewName('');
    // Cycle to the next swatch so adding several categories in a row doesn't
    // default every one of them to the same colour.
    const next = CATEGORY_COLORS[(CATEGORY_COLORS.indexOf(newColor as (typeof CATEGORY_COLORS)[number]) + 1) % CATEGORY_COLORS.length];
    setNewColor(next ?? CATEGORY_COLORS[0]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit categories"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface flex max-h-[85vh] w-full flex-col rounded-t-2xl sm:w-full sm:max-w-md sm:rounded-2xl"
      >
        <header className="border-line flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-lg font-medium">Categories</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-faint flex size-11 -mr-2.5 items-center justify-center rounded-lg"
          >
            <Close size={19} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {categories.length === 0 && (
            <p className="text-faint px-2 py-6 text-center text-sm">No categories yet. Add your first one below.</p>
          )}
          <ul className="flex flex-col">
            {categories.map((c) => {
              const count = tasks.filter((t) => t.categoryId === c.id).length;
              return (
                <li key={c.id} className="border-line border-b py-1 last:border-b-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setColorPickerFor(colorPickerFor === c.id ? null : c.id)}
                      aria-label={`Change colour for ${c.name}`}
                      aria-expanded={colorPickerFor === c.id}
                      className="flex size-11 shrink-0 items-center justify-center"
                    >
                      <span className="size-4 rounded-full" style={{ background: c.color }} />
                    </button>
                    <CategoryNameField category={c} onRename={actions.onRename} />
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(c.id)}
                      aria-label={`Delete ${c.name}`}
                      className="text-faint hover:text-overdue flex size-11 shrink-0 items-center justify-center rounded-lg"
                    >
                      <Trash size={16} />
                    </button>
                  </div>

                  {colorPickerFor === c.id && (
                    <div className="flex flex-wrap gap-1 px-1 pb-2">
                      {CATEGORY_COLORS.map((color) => (
                        <Swatch
                          key={color}
                          color={color}
                          label={`Set ${c.name} to ${color}`}
                          selected={color.toLowerCase() === c.color.toLowerCase()}
                          onSelect={() => {
                            actions.onRecolor(c.id, color);
                            setColorPickerFor(null);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {confirmDeleteId === c.id && (
                    <div className="bg-sunk mx-1 mb-2 flex flex-col gap-2.5 rounded-lg p-3 text-[13px]">
                      <p>
                        Delete <span className="font-semibold">{c.name}</span>?{' '}
                        {count > 0
                          ? `${count} task${count === 1 ? '' : 's'} will lose this category.`
                          : 'No tasks use it.'}
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-muted min-h-9 rounded-lg px-3 text-[13px] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            actions.onDelete(c);
                            setConfirmDeleteId(null);
                          }}
                          // text-bg, not white: the dark-mode overdue red is
                          // light enough that white on it falls under 4.5:1.
                          className="bg-overdue text-bg min-h-9 rounded-lg px-3 text-[13px] font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <form onSubmit={addCategory} className="border-line shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={LIMITS.categoryName}
              placeholder="New category"
              aria-label="New category name"
              className="border-line bg-surface placeholder:text-faint focus:border-accent min-h-11 flex-1 rounded-xl border px-3.5 text-[15px] outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="bg-accent text-accent-ink flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-opacity disabled:opacity-30"
            >
              <Plus size={17} />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 pt-2.5">
            {CATEGORY_COLORS.map((color) => (
              <Swatch key={color} color={color} label={`Use ${color}`} selected={color === newColor} onSelect={() => setNewColor(color)} />
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}

function Swatch({ color, selected, onSelect, label }: { color: string; selected: boolean; onSelect: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-shadow ${
        selected ? 'ring-accent ring-2 ring-offset-2 ring-offset-transparent' : ''
      }`}
    >
      <span className="flex size-6 items-center justify-center rounded-full" style={{ background: color }}>
        {selected && <Check size={11} className="text-white" />}
      </span>
    </button>
  );
}

/** Rename-in-place: commits on blur or Enter, Escape reverts without
 *  bubbling up to close the whole editor. */
function CategoryNameField({ category, onRename }: { category: Category; onRename: (id: string, name: string) => void }) {
  const [name, setName] = useState(category.name);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setName(category.name);
  }, [category.name]);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== category.name) onRename(category.id, trimmed);
    else setName(category.name);
  };

  return (
    <input
      value={name}
      maxLength={LIMITS.categoryName}
      aria-label={`Rename ${category.name}`}
      onChange={(e) => setName(e.target.value)}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          setName(category.name);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="min-h-11 flex-1 rounded-lg bg-transparent px-1.5 text-[14.5px] outline-none"
    />
  );
}

/** Trigger button shared by the sidebar and the phone chip row, so the
 *  editor is one implementation with one entry-point look. */
export function ManageCategoriesButton({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Edit categories"
        className="border-line text-faint flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-dashed px-3 text-[12.5px] font-medium whitespace-nowrap"
      >
        <Pencil size={12} />
        Edit
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-faint hover:bg-line/30 flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors"
    >
      <span className="flex w-[18px] shrink-0 justify-center">
        <Pencil size={14} />
      </span>
      Edit categories
    </button>
  );
}
