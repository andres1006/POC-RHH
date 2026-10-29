import { eachDayOfInterval, isWeekend, format } from "date-fns"

export function businessDays(start: Date, end: Date, holidays: string[]): number {
  if (end < start) return 0
  const set = new Set(holidays)
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d) && !set.has(format(d, "yyyy-MM-dd"))).length
}
