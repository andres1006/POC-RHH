import { getTenantContext, isHrRole, isManagerRole } from "@/lib/tenant"
import { availableDays, getDepartments, getHolidays, getLeaveBalance, getRequests, getTeam } from "@/lib/data"
import { formatDays } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { LeaveForms } from "@/components/leaves/leave-forms"
import { TeamCalendar } from "@/components/leaves/team-calendar"
import { RequestsTable } from "@/components/requests/requests-table"
import { Card } from "@/components/ui/card"

export const metadata = { title: "Vacaciones y permisos" }

export default async function LeavesPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ tab?: string; nuevo?: string }> }) {
  const { tenant: slug } = await params
  const { tab } = await searchParams
  const ctx = await getTenantContext(slug)
  const manager = isManagerRole(ctx.role)
  const [balance, holidays, requests, team, departments] = await Promise.all([
    getLeaveBalance(ctx.employee.id),
    getHolidays(ctx.tenant.country),
    getRequests(ctx.tenant.id),
    manager ? getTeam(ctx.employee.id) : Promise.resolve([]),
    getDepartments(ctx.tenant.id),
  ])
  const leaveRequests = requests.filter((r) => r.type_key === "vacation" || r.type_key === "permission")
  const teamIds = new Set(team.map((t) => t.id))
  const teamRequests = leaveRequests.filter((r) => teamIds.has(r.requester_id))
  const pendingForMe = teamRequests.filter((r) => r.status === "pending" && r.steps?.some((s) => s.status === "pending" && s.approver_id === ctx.employee.id))

  return (
    <>
      <PageHeader title="Vacaciones y permisos" description="Solicita ausencias y, si lideras un equipo, revisa su calendario y aprueba pendientes." />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <LeaveForms slug={slug} balance={balance} holidays={holidays} defaultTab={tab === "permiso" ? "permiso" : "vacaciones"} />
        <div className="flex flex-col gap-3">
          {[
            ["Disponibles", availableDays(balance)],
            ["Acumuladas", balance.accrued],
            ["Tomadas", balance.taken],
            ["Programadas", balance.scheduled],
          ].map(([label, value], i) => (
            <Card key={label as string} className={`flex-row items-center justify-between gap-2 px-4 py-3 ${i === 0 ? "border-primary/30 bg-primary/5" : ""}`}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums">{formatDays(value as number)}</p>
            </Card>
          ))}
        </div>
      </div>

      {manager && team.length > 0 && (
        <section className="mt-10 flex flex-col gap-4" aria-labelledby="team-title">
          <div>
            <h2 id="team-title" className="text-lg font-semibold">
              Mi equipo
            </h2>
            <p className="text-sm text-muted-foreground">
              {team.length} personas · {pendingForMe.length} {pendingForMe.length === 1 ? "pendiente" : "pendientes"} por aprobar
            </p>
          </div>
          <TeamCalendar team={team} requests={teamRequests} holidays={holidays} />
          <h3 className="text-sm font-semibold">Pendientes por aprobar</h3>
          <RequestsTable requests={pendingForMe} slug={slug} currentEmployeeId={ctx.employee.id} canDecide />
        </section>
      )}

      {isHrRole(ctx.role) && (
        <section className="mt-10 flex flex-col gap-4" aria-labelledby="all-title">
          <div>
            <h2 id="all-title" className="text-lg font-semibold">
              Todas las ausencias
            </h2>
            <p className="text-sm text-muted-foreground">Vacaciones y permisos de toda la empresa. Filtra por estado, tipo o área y exporta a CSV.</p>
          </div>
          <RequestsTable requests={leaveRequests} slug={slug} currentEmployeeId={ctx.employee.id} canDecide exportable departments={departments.map((d) => d.name)} />
        </section>
      )}
    </>
  )
}
