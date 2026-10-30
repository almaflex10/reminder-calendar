// Dátumkezelés helyi idő szerint. A toISOString() UTC-re vált, ami éjfél körül
// rossz napot adna – ezért itt mindent kézzel, a helyi dátumból számolunk.

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** A hét hétfőn kezdődik: 0 = hétfő ... 6 = vasárnap. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** "08:00:00" vagy "08:00" -> "08:00" */
export function shortTime(t: string | null): string | null {
  return t ? t.slice(0, 5) : null;
}

export function repeatLabel(days: number | null): string {
  switch (days) {
    case null:
      return 'Egyszeri';
    case 1:
      return 'Naponta';
    case 2:
      return 'Kétnaponta';
    default:
      return `${days} naponta`;
  }
}
