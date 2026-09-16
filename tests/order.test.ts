import { describe, expect, it } from 'vitest';
import { moveItem, orderAtEnd, orderAtStart, orderBetween, rebalance, reorderVisible } from '../shared/order';

const list = (...orders: number[]) => orders.map((sortOrder, i) => ({ id: `t${i}`, sortOrder }));

describe('orderBetween', () => {
  it('lands strictly between two neighbours', () => {
    expect(orderBetween(10, 20)).toBe(15);
    expect(orderBetween(1, 2)).toBeGreaterThan(1);
    expect(orderBetween(1, 2)).toBeLessThan(2);
  });

  it('steps off either end', () => {
    expect(orderBetween(null, 100)).toBeLessThan(100);
    expect(orderBetween(100, null)).toBeGreaterThan(100);
    expect(orderBetween(null, null)).toBeGreaterThan(0);
  });
});

describe('orderAtEnd / orderAtStart', () => {
  it('sorts after / before everything present', () => {
    const items = list(1024, 2048, 3072);
    expect(orderAtEnd(items)).toBeGreaterThan(3072);
    expect(orderAtStart(items)).toBeLessThan(1024);
  });

  it('handles an empty list', () => {
    expect(orderAtEnd([])).toBe(1024);
    expect(orderAtStart([])).toBe(1024);
  });
});

describe('moveItem', () => {
  const reordered = (items: { id: string; sortOrder: number }[], from: number, to: number) => {
    const change = moveItem(items, from, to)!;
    return items
      .map((i) => (i.id === change.id ? { ...i, sortOrder: change.sortOrder } : i))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.id);
  };

  it('moves an item down', () => {
    expect(reordered(list(1000, 2000, 3000, 4000), 0, 2)).toEqual(['t1', 't2', 't0', 't3']);
  });

  it('moves an item up', () => {
    expect(reordered(list(1000, 2000, 3000, 4000), 3, 1)).toEqual(['t0', 't3', 't1', 't2']);
  });

  it('moves to the very start and the very end', () => {
    expect(reordered(list(1000, 2000, 3000), 2, 0)).toEqual(['t2', 't0', 't1']);
    expect(reordered(list(1000, 2000, 3000), 0, 2)).toEqual(['t1', 't2', 't0']);
  });

  it('touches exactly one row', () => {
    expect(moveItem(list(1000, 2000, 3000), 0, 1)).toMatchObject({ id: 't0' });
  });

  it('is a no-op for a move that changes nothing', () => {
    expect(moveItem(list(1000, 2000), 1, 1)).toBeNull();
    expect(moveItem(list(1000, 2000), 5, 0)).toBeNull();
  });

  it('flags when the gap has collapsed to nothing', () => {
    expect(moveItem(list(1, 1 + 1e-9, 2), 2, 1)?.needsRebalance).toBe(true);
    expect(moveItem(list(1000, 2000, 3000), 2, 1)?.needsRebalance).toBe(false);
  });
});

describe('rebalance', () => {
  it('spreads a collapsed list back onto clean keys', () => {
    const out = rebalance(list(1, 1.0000001, 1.0000002));
    expect(out.map((o) => o.sortOrder)).toEqual([1024, 2048, 3072]);
  });
});

describe('reorderVisible', () => {
  const item = (id: string, sortOrder: number) => ({ id, sortOrder });
  const orderOf = (rows: { id: string; sortOrder: number }[]) =>
    [...rows].sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.id);

  it('is a no-op for a move that changes nothing', () => {
    const full = [item('v0', 1), item('v1', 2), item('v2', 3)];
    expect(reorderVisible(full, full, 1, 1)).toEqual([]);
    expect(reorderVisible(full, full, 5, 0)).toEqual([]);
  });

  it('touches only the dragged row, leaving a hidden item between its old neighbours', () => {
    // h sits between v0 and v1 in the full (unfiltered) order but is not part
    // of the view being dragged in.
    const v0 = item('v0', 1000);
    const h = item('h', 1400);
    const v1 = item('v1', 2000);
    const v2 = item('v2', 3000);
    const full = [v0, h, v1, v2];
    const visible = [v0, v1, v2];

    // Drag v2 to sit between v0 and v1 in the filtered view.
    const rows = reorderVisible(full, visible, 2, 1);
    expect(rows).toEqual([{ id: 'v2', sortOrder: 1500 }]);

    const merged = full.map((t) => (t.id === rows[0]!.id ? { ...t, sortOrder: rows[0]!.sortOrder } : t));
    // h is still sandwiched between v0 and v1 — its neighbours never moved.
    expect(orderOf(merged)).toEqual(['v0', 'h', 'v2', 'v1']);
  });

  it('rebalances the full list, not just the visible slice, when the gap collapses', () => {
    const v0 = item('v0', 1);
    const h = item('h', 1.0000000005); // hidden, sits between v0 and v1
    const v1 = item('v1', 1 + 1e-9); // gap to v0 has collapsed
    const v2 = item('v2', 2);
    const full = [v0, h, v1, v2];
    const visible = [v0, v1, v2];

    // Drag v2 to between v0 and v1 — the collapsed v0/v1 gap forces a rebalance.
    const rows = reorderVisible(full, visible, 2, 1);

    expect(rows).toHaveLength(full.length); // every row is renumbered, hidden included
    expect(orderOf(rows)).toEqual(['v0', 'v2', 'h', 'v1']);
    expect(rows.map((r) => r.sortOrder)).toEqual(expect.arrayContaining([1024, 2048, 3072, 4096]));
  });
});
