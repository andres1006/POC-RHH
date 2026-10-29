import { notFound } from "next/navigation"
import { addDays, format, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Clock } from "lucide-react"
import { getAttendance, getShifts, getTodayMarks } from "@/lib/data"
import { formatDateTime, fullName } from "@/lib/format"
import { getTenantContext, isHrRole, moduleOn } from "@/lib/tenant"
import { ClockActions } from "@/components/attendance/clock-actions"
import { PersonCell } from "@/components/shared/employee-avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const metadata = { title: "Asistencia y turnos" }

const SHIFT_LABEL: Record<string, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
  full: "Jornada",
}

function clock(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "—"
}

export default async function AttendancePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (!moduleOn(ctx.tenant, "attendance")) notFound()

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const from = format(weekStart, "yyyy-MM-dd")
  const to = format(addDays(weekStart, 6), "yyyy-MM-dd")
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

  const [mine, marks, shifts] = await Promise.all([
    getAttendance(ctx.employee.id, weekStart),
    isHrRole(ctx.role) ? getTodayMarks(ctx.tenant.id, dayStart.toISOString()) : Promise.resolve([]),
    getShifts(ctx.tenant.id, from, to),
  ])

  const myMarks = mine as { id: string; kind: string; at: string }[]
  const last = myMarks[0]
  const openShift = last?.kind === "in"
  const myShifts = (shifts as { id: string; date: string; kind: string; starts_at: string | null; ends_at: string | null; employee: { id: string } | { id: string }[] | null }[]).filter((s) => {
    const employee = Array.isArray(s.employee) ? s.employee[0] : s.employee
    return employee?.id === ctx.employee.id
  })
  const todayIns = new Set(
    (marks as { kind: string; employee_id?: string; employee?: { id: string } | { id: string }[] | null }[])
      .filter((m) => m.kind === "in")
      .map((m) => m.employee_id ?? (Array.isArray(m.employee) ? m.employee[0]?.id : m.employee?.id))
      .filter(Boolean),
  ).size

  return (
    <>
      <PageHeader title="Asistencia y turnos" description="Registra tu entrada y salida. Los turnos de la semana están abajo." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Mi jornada de hoy</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {openShift ? `Entrada registrada ${last ? formatDateTime(last.at) : ""}.` : "Aún no tienes una entrada abierta."}
            </p>
            <ClockActions slug={slug} openShift={openShift} />
          </CardContent>
        </Card>
        <KpiCard label="Marcas esta semana" value={myMarks.length} hint={isHrRole(ctx.role) ? `${todayIns} entradas hoy en la empresa` : "Entradas y salidas"} icon={Clock} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis marcas</CardTitle>
          </CardHeader>
          <CardContent>
            {myMarks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Esta semana todavía no hay marcas.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {myMarks.map((mark) => (
                  <li key={mark.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <Badge variant={mark.kind === "in" ? "secondary" : "outline"}>{mark.kind === "in" ? "Entrada" : "Salida"}</Badge>
                    <span className="tabular-nums text-muted-foreground">{formatDateTime(mark.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis turnos</CardTitle>
          </CardHeader>
          <CardContent>
            {myShifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes turnos asignados esta semana.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {myShifts.map((shift) => (
                  <li key={shift.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="capitalize">{format(new Date(`${shift.date}T12:00:00`), "EEEE d", { locale: es })}</span>
                    <span className="text-muted-foreground">
                      {SHIFT_LABEL[shift.kind] ?? shift.kind} · {clock(shift.starts_at)}–{clock(shift.ends_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {isHrRole(ctx.role) && (
        <section className="mt-8" aria-labelledby="shifts-title">
          <h2 id="shifts-title" className="mb-3 text-lg font-semibold">
            Turnos de la semana
          </h2>
          {(shifts as { id: string }[]).length === 0 ? (
            <EmptyState icon={Clock} title="Sin turnos publicados" description="Cuando se asignen turnos, aparecen en esta tabla." />
          ) : (
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    shifts as {
                      id: string
                      date: string
                      kind: string
                      starts_at: string | null
                      ends_at: string | null
                      employee: { first_name: string; last_name: string; avatar_url?: string | null; position?: string | null } | null
                    }[]
                  ).map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <PersonCell person={Array.isArray(shift.employee) ? shift.employee[0] : shift.employee} />
                      </TableCell>
                      <TableCell className="capitalize">{format(new Date(`${shift.date}T12:00:00`), "EEE d MMM", { locale: es })}</TableCell>
                      <TableCell>{SHIFT_LABEL[shift.kind] ?? shift.kind}</TableCell>
                      <TableCell className="tabular-nums">
                        {clock(shift.starts_at)}–{clock(shift.ends_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>
      )}
    </>
  )
}
