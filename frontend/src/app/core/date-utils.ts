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

/** "10:00–12:00"; csak kezdésnél "10:00"; ha csak befejezés van (éjféltől), "12:00-ig" */
export function timeRange(start: string | null, end: string | null): string | null {
  if (end && (!start || shortTime(start) === '00:00')) return `${shortTime(end)}-ig`;
  if (!start) return null;
  return end ? `${shortTime(start)}–${shortTime(end)}` : shortTime(start);
}

/** "HH:mm" a megadott időpontból */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------- Heti ismétlődés: bitmaszk, H = 1, K = 2, Sze = 4, ... V = 64 ----------
export const WEEKDAYS_MASK = 0b0011111; // H–P
export const WEEKEND_MASK = 0b1100000; // Szo–V
export const ALL_DAYS_MASK = 0b1111111;
export const DAY_NAMES_SHORT = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

/** [0, 2, 4] (H, Sze, P) -> 21 */
export function daysToMask(days: number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0);
}

/** 21 -> [0, 2, 4] */
export function maskToDays(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => mask & (1 << d));
}

export function isRecurring(t: { repeatIntervalDays: number | null; repeatWeekdays: number | null }): boolean {
  return t.repeatIntervalDays !== null || t.repeatWeekdays !== null;
}

/** "Naponta", "Kétnaponta", "3 naponta", "Hétköznap", "Hétvégén", "H, Sze, P" */
export function repeatLabel(days: number | null, weekdays: number | null = null): string {
  if (weekdays !== null) {
    if (weekdays === WEEKDAYS_MASK) return 'Hétköznap';
    if (weekdays === WEEKEND_MASK) return 'Hétvégén';
    if (weekdays === ALL_DAYS_MASK) return 'Minden nap';
    return maskToDays(weekdays)
      .map((d) => DAY_NAMES_SHORT[d])
      .join(', ');
  }
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
