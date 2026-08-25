import { describe, expect, it } from 'vitest';
import { moveItem, orderAtEnd, orderAtStart, orderBetween, rebalance } from '../shared/order';

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
