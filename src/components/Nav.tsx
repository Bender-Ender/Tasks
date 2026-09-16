import type { Category } from '@shared/schema';
import { ManageCategoriesButton } from './CategoryEditor';
import { Stack, Sunrise } from './Icons';

/** Today/All/category-filter. A discriminated union rather than three
 *  booleans so a view is always exactly one thing and never persisted —
 *  reopening the app should not surprise you with a filter you forgot about. */
export type View = { kind: 'today' } | { kind: 'all' } | { kind: 'category'; id: string };

export function viewTitle(view: View, categories: Category[]): string {
  if (view.kind === 'today') return 'Today';
  if (view.kind === 'all') return 'All tasks';
  return categories.find((c) => c.id === view.id)?.name ?? 'Category';
}

/** Desktop-only: a persistent column of destinations, replacing the phone's
 *  tab bar with room for the full category list and its counts. */
export function Sidebar({
  view,
  onSelect,
  todayCount,
  allCount,
  categories,
  categoryCounts,
  onManageCategories,
}: {
  view: View;
  onSelect: (view: View) => void;
  todayCount: number;
  allCount: number;
  categories: Category[];
  categoryCounts: Map<string, number>;
  onManageCategories: () => void;
}) {
  return (
    <aside className="border-line bg-sunk flex w-full flex-col gap-6 overflow-y-auto border-r px-3.5 py-6">
      <div className="font-display px-2.5 text-[23px] font-medium tracking-tight">Tasks</div>

      <nav className="flex flex-col gap-0.5">
        <NavRow
          active={view.kind === 'today'}
          icon={<Sunrise size={18} />}
          label="Today"
          count={todayCount}
          onClick={() => onSelect({ kind: 'today' })}
        />
        <NavRow
          active={view.kind === 'all'}
          icon={<Stack size={18} />}
          label="All tasks"
          count={allCount}
          onClick={() => onSelect({ kind: 'all' })}
        />
      </nav>

      <div className="flex flex-col gap-0.5">
        {categories.length > 0 && (
          <>
            <h2 className="text-faint px-2.5 pb-1 text-[11px] font-semibold tracking-[0.08em] uppercase">Categories</h2>
            {categories.map((c) => (
              <NavRow
                key={c.id}
                active={view.kind === 'category' && view.id === c.id}
                icon={<span className="size-[7px] shrink-0 rounded-full" style={{ background: c.color }} />}
                label={c.name}
                count={categoryCounts.get(c.id) ?? 0}
                onClick={() => onSelect({ kind: 'category', id: c.id })}
              />
            ))}
          </>
        )}
        <ManageCategoriesButton onClick={onManageCategories} />
      </div>
    </aside>
  );
}

function NavRow({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors ${
        active ? 'bg-accent-soft text-accent font-semibold' : 'text-muted hover:bg-line/30'
      }`}
    >
      <span className="flex w-[18px] shrink-0 justify-center">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="text-xs tabular-nums opacity-70">{count}</span>
    </button>
  );
}

/** Phone-only bottom tab bar. Only Today/All live here — a category is a
 *  refinement of All, shown one level down as the chip row, so it does not
 *  need its own tab. */
export function TabBar({ view, onSelect }: { view: View; onSelect: (view: View) => void }) {
  const onToday = view.kind === 'today';
  return (
    <nav
      aria-label="Views"
      className="border-line bg-surface fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-xl">
        <TabButton active={onToday} icon={<Sunrise size={20} />} label="Today" onClick={() => onSelect({ kind: 'today' })} />
        <TabButton active={!onToday} icon={<Stack size={20} />} label="All" onClick={() => onSelect({ kind: 'all' })} />
      </div>
    </nav>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
        active ? 'text-accent' : 'text-faint'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Phone-only: a horizontal row of category filters shown under the All tab,
 *  standing in for the sidebar's category list where there is no sidebar.
 *  The trailing "Edit" chip is the phone's entry point into the category
 *  editor — it rides along the row that is already about categories, rather
 *  than claiming space of its own elsewhere on a 390px screen. */
export function CategoryChips({
  view,
  categories,
  onSelect,
  onManage,
}: {
  view: View;
  categories: Category[];
  onSelect: (view: View) => void;
  onManage: () => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip active={view.kind === 'all'} label="All" onClick={() => onSelect({ kind: 'all' })} />
      {categories.map((c) => (
        <Chip key={c.id} active={view.kind === 'category' && view.id === c.id} label={c.name} onClick={() => onSelect({ kind: 'category', id: c.id })} />
      ))}
      <ManageCategoriesButton compact onClick={onManage} />
    </div>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
        active ? 'border-transparent bg-accent-soft text-accent' : 'border-line bg-surface text-muted'
      }`}
    >
      {label}
    </button>
  );
}
