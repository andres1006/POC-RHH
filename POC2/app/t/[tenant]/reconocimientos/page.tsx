import { notFound } from "next/navigation"
import { Award } from "lucide-react"
import { getEmployees, getRecognitions } from "@/lib/data"
import { formatDate, fullName } from "@/lib/format"
import { getTenantContext, moduleOn } from "@/lib/tenant"
import { RecognitionDialog } from "@/components/culture/recognition-dialog"
import { PersonCell } from "@/components/shared/employee-avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Reconocimientos" }

interface Person {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string | null
  position?: string | null
}

export default async function RecognitionsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const { tenant: slug } = await params
  const { nuevo } = await searchParams
  const ctx = await getTenantContext(slug)
  if (!moduleOn(ctx.tenant, "recognitions")) notFound()

  const [rows, employees] = await Promise.all([getRecognitions(ctx.tenant.id), getEmployees(ctx.tenant.id)])
  const people = employees.filter((e) => e.id !== ctx.employee.id)

  return (
    <>
      <PageHeader
        title="Reconocimientos"
        description="Agradece en público lo que mueve al equipo: colaboración, servicio, innovación y compromiso."
        actions={<RecognitionDialog slug={slug} people={people} defaultOpen={nuevo === "1"} />}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Award} title="Todavía no hay reconocimientos" description="El primero aparece aquí y también en el portal." />
      ) : (
        <div className="flex flex-col gap-3">
          {(
            rows as {
              id: string
              value: string
              message: string
              created_at: string
              from: Person | Person[] | null
              to: Person | Person[] | null
            }[]
          ).map((row) => {
            const from = Array.isArray(row.from) ? row.from[0] : row.from
            const to = Array.isArray(row.to) ? row.to[0] : row.to
            return (
              <Card key={row.id}>
                <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <PersonCell person={from} />
                      <span className="text-sm text-muted-foreground">reconoció a</span>
                      <PersonCell person={to} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{row.value}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
                    </div>
                  </div>
                  {row.message && <p className="text-sm leading-relaxed">{row.message}</p>}
                  <p className="sr-only">
                    {fullName(from)} reconoció a {fullName(to)} por {row.value}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
