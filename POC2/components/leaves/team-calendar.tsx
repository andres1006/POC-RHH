"use client"

import { useMemo, useState } from "react"
import { addMonths, eachDayOfInterval, endOfMonth, format, isWeekend, isWithinInterval, parseISO, startOfMonth, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { EmployeeLite, RequestRow } from "@/lib/types"
import { fullName } from "@/lib/format"
import { EmployeeAvatar } from "@/components/shared/employee-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TeamCalendar({ team, requests, holidays }: { team: EmployeeLite[]; requests: RequestRow[]; holidays: string[] }) {
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const days = useMemo(() => eachDayOfInterval({ start: month, end: endOfMonth(month) }), [month])
  const holidaySet = useMemo(() => new Set(holidays), [holidays])

  const absences = useMemo(
    () =>
      requests
        .filter((r) => (r.type_key === "vacation" || r.type_key === "permission") && (r.status === "approved" || r.status === "pending"))
        .map((r) => {
          const p = r.payload as { start_date?: string; end_date?: string; date?: string }
          const start = parseISO(p.start_date ?? p.date ?? "")
          const end = parseISO(p.end_date ?? p.date ?? "")
          return { employeeId: r.requester_id, start, end, status: r.status, title: r.title }
        }),
    [requests],
  )

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium first-letter:uppercase">{format(month, "MMMM yyyy", { locale: es })}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Mes anterior">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Hoy
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Mes siguiente">
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-44 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                Persona
              </th>
              {days.map((d) => (
                <th key={d.toISOString()} scope="col" className={cn("min-w-7 px-0 py-2 text-center font-normal text-muted-foreground", (isWeekend(d) || holidaySet.has(format(d, "yyyy-MM-dd"))) && "bg-muted/50", isSameDay(d, new Date()) && "font-semibold text-primary")}>
                  <span className="block">{format(d, "EEEEE", { locale: es })}</span>
                  <span className="block tabular-nums">{format(d, "d")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id} className="border-t">
                <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-1.5 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <EmployeeAvatar person={member} className="size-6" />
                    <span className="truncate">{fullName(member)}</span>
                  </span>
                </th>
                {days.map((d) => {
                  const a = absences.find((x) => x.employeeId === member.id && isWithinInterval(d, { start: x.start, end: x.end }))
                  const off = isWeekend(d) || holidaySet.has(format(d, "yyyy-MM-dd"))
                  return (
                    <td key={d.toISOString()} className={cn("h-8 p-0.5", off && "bg-muted/50")}>
                      {a && !off && <span title={a.title} className={cn("block h-full rounded-sm", a.status === "approved" ? "bg-primary" : "bg-primary/35 ring-1 ring-inset ring-primary/40")} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary" aria-hidden /> Aprobada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary/35 ring-1 ring-primary/40" aria-hidden /> Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted" aria-hidden /> Fin de semana / festivo
        </span>
      </div>
    </Card>
  )
}
