/** Deadlines are plain 'YYYY-MM-DD' strings with no timezone.
 *  Everything here works in the viewer's LOCAL date so that "due today" means
 *  today where they are, not today in UTC. */

export type Urgency = 'overdue' | 'today' | 'upcoming';

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO date strings sort lexicographically, so plain comparison is correct. */
export function urgencyOf(deadline: string, today: string = todayISO()): Urgency {
  if (deadline < today) return 'overdue';
  if (deadline === today) return 'today';
  return 'upcoming';
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  // Construct in local time; `new Date(iso)` would parse as UTC and can land
  // on the previous day west of Greenwich.
  return { date: new Date(y, m - 1, d), y, m, d };
}

const dayDiff = (a: string, b: string) =>
  Math.round((parts(a).date.getTime() - parts(b).date.getTime()) / 86_400_000);

/** Short label for a card chip: "Overdue", "Today", "Sat 30", "Mon 1 Sep". */
export function shortDeadline(deadline: string, today: string = todayISO()): string {
  const diff = dayDiff(deadline, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return diff === -1 ? '1 day overdue' : `${-diff} days overdue`;

  const { date, m } = parts(deadline);
  const sameMonth = m === parts(today).m && date.getFullYear() === parts(today).date.getFullYear();
  const stem = `${WEEKDAY[date.getDay()]} ${date.getDate()}`;
  return sameMonth ? stem : `${stem} ${MONTH[m - 1]}`;
}

/** Full label for the detail view: "Sat 30 Aug 2026". */
export function longDeadline(deadline: string): string {
  const { date, m } = parts(deadline);
  return `${WEEKDAY[date.getDay()]} ${date.getDate()} ${MONTH[m - 1]} ${date.getFullYear()}`;
}
