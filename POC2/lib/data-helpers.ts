import type { LeaveBalance } from "@/lib/types"

export function availableDays(b: LeaveBalance) {
  return Math.round((b.accrued - b.taken - b.scheduled) * 10) / 10
}
