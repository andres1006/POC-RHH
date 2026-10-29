import { notFound } from "next/navigation"
import { getEmployees, getPerformance, getTeam } from "@/lib/data"
import { fullName } from "@/lib/format"
import { getTenantContext, isHrRole, isManagerRole, moduleOn } from "@/lib/tenant"
import { NineBox, type NinePerson } from "@/components/performance/nine-box"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Desempeño" }

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

  const reviewByEmployee = new Map(
    (reviews as { employee_id: string; performance: number; potential: number }[]).map((review) => [review.employee_id, review]),
  )

  const source = hr ? roster : manager ? team : [ctx.employee]
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

  const mine = reviewByEmployee.get(ctx.employee.id)

  return (
    <>
      <PageHeader
        title="Desempeño"
        description={hr ? "Matriz 9-box de toda la empresa, ciclo 2026-H1." : manager ? "Calibra a tu equipo en la matriz 9-box, ciclo 2026-H1." : "Tu ubicación en el ciclo 2026-H1."}
      />
      <Card>
        <CardHeader>
          <CardTitle>{people.length} {people.length === 1 ? "persona" : "personas"}</CardTitle>
        </CardHeader>
        <CardContent>
          <NineBox slug={slug} people={people} editable={manager} />
        </CardContent>
      </Card>
      {!manager && (
        <p className="mt-4 text-sm text-muted-foreground">
          {mine ? `${fullName(ctx.employee)} está en desempeño ${mine.performance} y potencial ${mine.potential}.` : "Todavía no tienes una evaluación en este ciclo."}
        </p>
      )}
    </>
  )
}
