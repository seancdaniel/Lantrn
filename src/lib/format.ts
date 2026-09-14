const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', opts);

const int = nf({ maximumFractionDigits: 0 });
const oneDp = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDp = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatInt = (n: number) => int.format(Math.round(n));
export const formatMiles = (n: number, dp: 1 | 2 = 1) => (dp === 2 ? twoDp : oneDp).format(n);
export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Parses YYYY-MM-DD in local time so dates never drift across a timezone boundary. */
export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const weekdayName = (iso: string) => WEEKDAYS[parseDate(iso).getDay()];
export const weekdayShort = (iso: string) => WEEKDAYS[parseDate(iso).getDay()].slice(0, 3);
export const monthShort = (index: number) => MONTHS[index].slice(0, 3);

export function formatDateLong(iso: string) {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateMedium(iso: string) {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function formatMonthYear(iso: string) {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / 86_400_000);
}

export function relativeDay(iso: string, today: string) {
  if (iso === today) return 'Today';
  const diff = daysBetween(iso, today);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDateMedium(iso);
}

export function addDays(iso: string, days: number) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export const milesToSteps = (miles: number, stepsPerMile: number) => Math.round(miles * stepsPerMile);
export const stepsToMiles = (steps: number, stepsPerMile: number) => steps / stepsPerMile;

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
