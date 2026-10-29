import { notFound } from "next/navigation"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { getDocuments, getEmployees, getRequests } from "@/lib/data"
import { getTenantContext, isHrRole, moduleOn } from "@/lib/tenant"
import { HeadcountByArea, HeadcountTrend } from "@/components/analytics/people-charts"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Employee } from "@/lib/types"

export const metadata = { title: "Indicadores" }

function areaName(employee: Employee) {
  const department = employee.department as { name: string } | { name: string }[] | null | undefined
  if (Array.isArray(department)) return department[0]?.name ?? "Sin área"
  return department?.name ?? "Sin área"
}

export default async function AnalyticsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (!isHrRole(ctx.role) || !moduleOn(ctx.tenant, "analytics")) notFound()

  const [employees, requests, documents] = await Promise.all([
    getEmployees(ctx.tenant.id),
    getRequests(ctx.tenant.id),
    getDocuments(ctx.tenant.id),
  ])

  const byArea = new Map<string, number>()
  const byContract = new Map<string, number>()
  for (const employee of employees) {
    const area = areaName(employee)
    byArea.set(area, (byArea.get(area) ?? 0) + 1)
    const contract = employee.contract_type || "Sin dato"
    byContract.set(contract, (byContract.get(contract) ?? 0) + 1)
  }

  const year = new Date().getFullYear()
  const hires = employees.filter((e) => e.hire_date?.startsWith(String(year))).length
  const pendingRequests = requests.filter((r) => r.status === "pending").length
  const pendingDocs = documents.filter((d) => d.status === "pending_signature").length

  const trend = Array.from({ length: 12 }, (_, index) => {
    const month = subMonths(new Date(), 11 - index)
    const end = format(month, "yyyy-MM")
    const value = employees.filter((e) => e.hire_date && e.hire_date.slice(0, 7) <= end).length
    return { name: format(month, "MMM", { locale: es }), value }
  })

  const requestBars = [
    ["Pendientes", requests.filter((r) => r.status === "pending").length],
    ["Aprobadas", requests.filter((r) => r.status === "approved").length],
    ["Rechazadas", requests.filter((r) => r.status === "rejected").length],
  ] as const

  return (
    <>
      <PageHeader title="Indicadores de personas" description={`${ctx.tenant.name} · datos al día de hoy.`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Headcount" value={employees.length} hint={`${byArea.size} áreas`} />
        <KpiCard label="Ingresos del año" value={hires} />
        <KpiCard label="Solicitudes en curso" value={pendingRequests} tone={pendingRequests > 0 ? "warning" : "default"} />
        <KpiCard label="Firmas pendientes" value={pendingDocs} tone={pendingDocs > 0 ? "warning" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personas por área</CardTitle>
          </CardHeader>
          <CardContent>
            <HeadcountByArea data={[...byArea.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evolución del headcount</CardTitle>
          </CardHeader>
          <CardContent>
            <HeadcountTrend data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tipo de contrato</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[...byContract.entries()].map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{name}</span>
                  <b className="tabular-nums">{value}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(value / Math.max(employees.length, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {requestBars.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <b className="tabular-nums">{value}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(value / Math.max(requests.length, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
