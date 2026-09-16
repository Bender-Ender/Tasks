/** Fractional ordering.
 *
 *  Every task and subtask carries a float `sortOrder`. Moving one item writes
 *  exactly one row — we pick a number between its new neighbours rather than
 *  renumbering the list. `null` means "off the end".
 */

/** Gap used when appending to either end of a list. */
const STEP = 1024;

export function orderBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return STEP;
  if (before === null) return after! - STEP;
  if (after === null) return before + STEP;
  return (before + after) / 2;
}

/** Sort key for a new item added at the end of `existing`. */
export function orderAtEnd(existing: readonly { sortOrder: number }[]): number {
  const max = existing.reduce((m, i) => (i.sortOrder > m ? i.sortOrder : m), -Infinity);
  return max === -Infinity ? STEP : max + STEP;
}

/** Sort key for a new item added at the start of `existing`. */
export function orderAtStart(existing: readonly { sortOrder: number }[]): number {
  const min = existing.reduce((m, i) => (i.sortOrder < m ? i.sortOrder : m), Infinity);
  return min === Infinity ? STEP : min - STEP;
}

/**
 * Move `list[from]` to index `to`, returning the single row that changed.
 * Returns null when the move is a no-op.
 *
 * Floats between two very close neighbours eventually run out of precision.
 * That takes ~50 halvings of the same gap, which no hand-driven reorder will
 * reach; if it ever does, `needsRebalance` flags it and the caller renumbers.
 */
export function moveItem<T extends { id: string; sortOrder: number }>(
  list: readonly T[],
  from: number,
  to: number,
): { id: string; sortOrder: number; needsRebalance: boolean } | null {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return null;

  const without = list.filter((_, i) => i !== from);
  const before = to > 0 ? (without[to - 1]?.sortOrder ?? null) : null;
  const after = without[to]?.sortOrder ?? null;
  const sortOrder = orderBetween(before, after);

  const gap = before !== null && after !== null ? Math.abs(after - before) : STEP;
  return { id: list[from]!.id, sortOrder, needsRebalance: gap < 1e-6 };
}

/** Renumber a whole list onto clean, evenly spaced keys. */
export function rebalance<T extends { id: string }>(list: readonly T[]): { id: string; sortOrder: number }[] {
  return list.map((item, i) => ({ id: item.id, sortOrder: (i + 1) * STEP }));
}

/**
 * Drag-to-reorder in a filtered view. `full` is every item in true sort order
 * (including ones the current filter hides); `visible` is the subset actually
 * being dragged, and `from`/`to` are indices into it.
 *
 * A plain move only ever touches the dragged row, so it is safe to compute
 * against `visible` alone — a hidden item sitting between the two visible
 * neighbours keeps its sortOrder, and therefore its place between them.
 *
 * A rebalance is not safe against `visible`: renumbering only the filtered
 * rows would throw away their ordering relative to every hidden item. So we
 * splice the move into `full` first (placing the dragged item right after
 * whichever visible neighbour it now follows, same rule `moveItem` uses) and
 * rebalance that instead, renumbering every row.
 */
export function reorderVisible<T extends { id: string; sortOrder: number }>(
  full: readonly T[],
  visible: readonly T[],
  from: number,
  to: number,
): { id: string; sortOrder: number }[] {
  const change = moveItem(visible, from, to);
  if (!change) return [];
  if (!change.needsRebalance) return [{ id: change.id, sortOrder: change.sortOrder }];

  const without = visible.filter((_, i) => i !== from);
  const beforeId = to > 0 ? (without[to - 1]?.id ?? null) : null;

  const fullWithout = full.filter((t) => t.id !== change.id);
  const insertAt = beforeId !== null ? fullWithout.findIndex((t) => t.id === beforeId) + 1 : 0;
  const moved = full.find((t) => t.id === change.id)!;
  const spliced = [...fullWithout.slice(0, insertAt), moved, ...fullWithout.slice(insertAt)];

  return rebalance(spliced);
}
