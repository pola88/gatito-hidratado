import { format, isToday, parseISO, differenceInMinutes } from 'date-fns'

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isSameDay(dateStr: string): boolean {
  return isToday(parseISO(dateStr))
}

export function minutesSince(timestamp: number): number {
  return differenceInMinutes(new Date(), new Date(timestamp))
}

export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm')
}
