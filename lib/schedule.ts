export function normalizeScheduleTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour %= 12;
    if (meridiem === 'PM') hour += 12;
  } else if (hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Display canonical 24-hour database times as clear 12-hour AM/PM values. */
export function formatScheduleTime(value: unknown): string {
  const normalized = normalizeScheduleTime(value);
  if (!normalized) return typeof value === 'string' ? value : '';

  const [hourText, minute] = normalized.split(':');
  const hour = Number(hourText);
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${meridiem}`;
}
