import { normalizeScheduleTime } from '@/lib/schedule';

export function hasTripDeparted(date: string, time: string): boolean {
  const normalized = normalizeScheduleTime(time);
  if (!normalized) return true;
  const departure = new Date(`${date}T${normalized}:00+08:00`);
  return Number.isNaN(departure.getTime()) || departure.getTime() < Date.now();
}
