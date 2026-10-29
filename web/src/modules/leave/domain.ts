// Reglas de vacaciones (Colombia). Funciones puras: sin I/O, probadas en domain.test.ts.

// shortcut: festivos fijos 2026-2027, reemplazar por tabla `holidays` (o cálculo Ley Emiliani) en fase 1.
export const HOLIDAYS_CO = new Set([
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18',
  '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12',
  '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01', '2027-05-10',
  '2027-05-31', '2027-06-07', '2027-07-05', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18',
  '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25',
])

export const ANNUAL_VACATION_DAYS = 15

const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => new Date(`${s}T00:00:00Z`)

export function isBusinessDay(day: string, holidays: Set<string> = HOLIDAYS_CO) {
  const dow = parse(day).getUTCDay()
  return dow !== 0 && dow !== 6 && !holidays.has(day)
}

/** Días hábiles entre `from` y `to`, ambos inclusive. 0 si el rango es inválido. */
export function businessDays(from: string, to: string, holidays: Set<string> = HOLIDAYS_CO) {
  if (!from || !to || from > to) return 0
  let count = 0
  for (let d = parse(from); iso(d) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isBusinessDay(iso(d), holidays)) count++
  }
  return count
}

/** 15 días hábiles por año trabajado, acumulados proporcionalmente por día calendario. */
export function accruedDays(hireDate: string, today: string) {
  const days = (parse(today).getTime() - parse(hireDate).getTime()) / 86_400_000
  return Math.max(0, Math.floor((days / 365) * ANNUAL_VACATION_DAYS * 100) / 100)
}

export type LeaveBalance = { accrued: number; taken: number; scheduled: number; available: number }

export function leaveBalance(hireDate: string, today: string, taken: number, scheduled: number): LeaveBalance {
  const accrued = accruedDays(hireDate, today)
  return { accrued, taken, scheduled, available: Math.round((accrued - taken - scheduled) * 100) / 100 }
}
