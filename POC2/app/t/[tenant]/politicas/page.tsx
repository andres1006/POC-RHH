import Link from "next/link"
import { ScrollText } from "lucide-react"
import { getDocuments } from "@/lib/data"
import { getTenantContext } from "@/lib/tenant"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Políticas" }

export default async function PoliciesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const documents = await getDocuments(ctx.tenant.id)
  const policies = documents.filter((doc) => /pol[ií]tic/i.test(doc.name))

  const grouped = new Map<string, { name: string; total: number; pending: number; signed: number }>()
  for (const doc of policies) {
    const current = grouped.get(doc.name) ?? { name: doc.name, total: 0, pending: 0, signed: 0 }
    current.total += 1
    if (doc.status === "pending_signature") current.pending += 1
    if (doc.status === "signed") current.signed += 1
    grouped.set(doc.name, current)
  }
  const mine = policies.filter((doc) => doc.employee_id === ctx.employee.id)

  return (
    <>
      <PageHeader
        title="Políticas"
        description="Documentos de la empresa que requieren lectura o firma."
        actions={
          <Button variant="outline" render={<Link href={`/t/${slug}/documentos`} />} nativeButton={false}>
            Ir a documentos
          </Button>
        }
      />

      {mine.length > 0 && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Las tuyas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mine.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{doc.name}</span>
                <Badge variant={doc.status === "signed" ? "secondary" : "outline"}>{doc.status === "signed" ? "Firmada" : "Pendiente de firma"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {[...grouped.values()].length === 0 ? (
        <EmptyState icon={ScrollText} title="No hay políticas publicadas" description="Cuando RR. HH. envíe una política para firma, aparece aquí y en Documentos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...grouped.values()].map((policy) => (
            <Card key={policy.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="size-4 text-primary" aria-hidden />
                  {policy.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  {policy.signed} firmadas · {policy.pending} pendientes
                </span>
                <span className="tabular-nums">{policy.total} copias</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
