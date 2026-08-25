import { describe, expect, it } from 'vitest';
import { longDeadline, shortDeadline, todayISO, urgencyOf } from '../src/lib/dates';

const TODAY = '2026-08-25'; // a Tuesday

describe('todayISO', () => {
  it('reads the local date, not the UTC one', () => {
    // 23:30 local on the 25th is already the 26th in UTC east of Greenwich;
    // the deadline the user sees must still say the 25th.
    expect(todayISO(new Date(2026, 7, 25, 23, 30))).toBe('2026-08-25');
    expect(todayISO(new Date(2026, 0, 1, 0, 15))).toBe('2026-01-01');
  });

  it('pads month and day', () => {
    expect(todayISO(new Date(2026, 8, 5))).toBe('2026-09-05');
  });
});

describe('urgencyOf', () => {
  it('classifies against the local today', () => {
    expect(urgencyOf('2026-08-24', TODAY)).toBe('overdue');
    expect(urgencyOf('2026-08-25', TODAY)).toBe('today');
    expect(urgencyOf('2026-08-26', TODAY)).toBe('upcoming');
  });

  it('handles a year boundary', () => {
    expect(urgencyOf('2025-12-31', '2026-01-01')).toBe('overdue');
    expect(urgencyOf('2026-01-02', '2026-01-01')).toBe('upcoming');
  });
});

describe('shortDeadline', () => {
  it('names the near days rather than dating them', () => {
    expect(shortDeadline('2026-08-25', TODAY)).toBe('Today');
    expect(shortDeadline('2026-08-26', TODAY)).toBe('Tomorrow');
  });

  it('counts overdue days, singular and plural', () => {
    expect(shortDeadline('2026-08-24', TODAY)).toBe('1 day overdue');
    expect(shortDeadline('2026-08-21', TODAY)).toBe('4 days overdue');
  });

  it('omits the month within the current month and adds it beyond', () => {
    expect(shortDeadline('2026-08-30', TODAY)).toBe('Sun 30');
    expect(shortDeadline('2026-09-01', TODAY)).toBe('Tue 1 Sep');
  });

  it('adds the month across a year boundary', () => {
    expect(shortDeadline('2027-01-04', TODAY)).toBe('Mon 4 Jan');
  });
});

describe('longDeadline', () => {
  it('spells out the full date', () => {
    expect(longDeadline('2026-08-30')).toBe('Sun 30 Aug 2026');
  });

  it('parses as a local date rather than a UTC instant', () => {
    // new Date('2026-03-01') is midnight UTC, which is Feb 28 in the Americas.
    expect(longDeadline('2026-03-01')).toBe('Sun 1 Mar 2026');
  });
});
