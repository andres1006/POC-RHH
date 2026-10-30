import { notFound } from "next/navigation"
import { AlertTriangle, CheckCircle2, Target } from "lucide-react"
import { getEmployees, getPerformance, getTeam } from "@/lib/data"
import { buildOkrs, krStatus, objectiveProgress, type OkrPerson } from "@/lib/okrs"
import { getTenantContext, isHrRole, isManagerRole, moduleOn } from "@/lib/tenant"
import { OkrBoard } from "@/components/performance/okr-board"
import { NineBox, type NinePerson } from "@/components/performance/nine-box"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "OKRs y desempeño" }

function asOkrPerson(person: { id: string; first_name: string; last_name: string; position: string | null; manager_id?: string | null; department?: { name: string } | null }): OkrPerson {
  return {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    position: person.position,
    department: person.department?.name ?? "Sin área",
    manager_id: person.manager_id ?? null,
  }
}

export default async function PerformancePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (!moduleOn(ctx.tenant, "performance")) notFound()

  const hr = isHrRole(ctx.role)
  const manager = isManagerRole(ctx.role)
  const [reviews, roster, team] = await Promise.all([
    getPerformance(ctx.tenant.id),
    hr ? getEmployees(ctx.tenant.id) : Promise.resolve([]),
    !hr && manager ? getTeam(ctx.employee.id) : Promise.resolve([]),
  ])

  const source = hr ? roster : manager ? [ctx.employee, ...team.filter((p) => p.id !== ctx.employee.id)] : [ctx.employee]
  const okrPeople = source.map(asOkrPerson)
  const okrs = buildOkrs({ tenantName: ctx.tenant.name, people: okrPeople })
  const visiblePeople = hr || manager ? okrs.people : okrs.people.filter((row) => row.person.id === ctx.employee.id)
  const visibleDepartments = hr
    ? okrs.departments
    : okrs.departments.filter((dept) => dept.name === (ctx.employee.department?.name ?? "Sin área"))

  const companyProgress = okrs.company.reduce((sum, item) => sum + objectiveProgress(item), 0) / Math.max(okrs.company.length, 1)
  const allObjectives = [...okrs.company, ...visibleDepartments.flatMap((d) => d.objectives)]
  const allKrs = allObjectives.flatMap((o) => o.keyResults)
  const atRisk = allKrs.filter((kr) => krStatus(kr) !== "on_track").length
  const onTrack = allKrs.filter((kr) => krStatus(kr) === "on_track").length

  const reviewByEmployee = new Map(
    (reviews as { employee_id: string; performance: number; potential: number }[]).map((review) => [review.employee_id, review]),
  )
  const people: NinePerson[] = source.map((person) => {
    const review = reviewByEmployee.get(person.id)
    return {
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
      position: person.position,
      performance: review?.performance ?? null,
      potential: review?.potential ?? null,
    }
  })

  return (
    <>
      <PageHeader
        title="OKRs y key results"
        description="Objetivos de compañía, departamento y persona para el ciclo 2026. La calibración 9-box queda en la segunda pestaña."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Avance compañía" value={`${Math.round(companyProgress)}%`} icon={Target} />
        <KpiCard label="Key results en curso" value={onTrack} hint={`${allKrs.length} en total`} icon={CheckCircle2} tone="success" />
        <KpiCard label="Key results en riesgo" value={atRisk} icon={AlertTriangle} tone={atRisk > 0 ? "warning" : "default"} />
      </div>

      <Tabs defaultValue="okrs" className="gap-4">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="h-auto min-h-8 w-max">
            <TabsTrigger value="okrs" className="px-3">
              OKRs
            </TabsTrigger>
            <TabsTrigger value="nine" className="px-3">
              Calibración 9-box
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="okrs">
          <OkrBoard company={okrs.company} departments={visibleDepartments} people={visiblePeople} currentEmployeeId={ctx.employee.id} />
        </TabsContent>
        <TabsContent value="nine">
          <Card>
            <CardHeader>
              <CardTitle>
                {people.length} {people.length === 1 ? "persona" : "personas"}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[640px]">
                <NineBox slug={slug} people={people} editable={manager} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
