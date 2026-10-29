import { getTenantContext, isHrRole } from "@/lib/tenant"
import { getDocumentTemplates, getDocuments, getEmployees } from "@/lib/data"
import { PageHeader } from "@/components/shared/page-header"
import { DocumentsTable } from "@/components/documents/documents-table"
import { GenerateCertificateDialog } from "@/components/documents/generate-certificate-dialog"
import { BulkSendDialog } from "@/components/documents/bulk-send-dialog"
import { SignaturesReport } from "@/components/documents/signatures-report"

export const metadata = { title: "Documentos" }

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ generar?: string }> }) {
  const { tenant: slug } = await params
  const { generar } = await searchParams
  const ctx = await getTenantContext(slug)
  const hr = isHrRole(ctx.role)
  const [mine, templates, all, employees] = await Promise.all([
    getDocuments(ctx.tenant.id, ctx.employee.id),
    getDocumentTemplates(ctx.tenant.id),
    hr ? getDocuments(ctx.tenant.id) : Promise.resolve([]),
    hr ? getEmployees(ctx.tenant.id) : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader
        title="Documentos y firma"
        description="Genera certificados, firma documentos pendientes y descarga tu historial."
        actions={
          <>
            <GenerateCertificateDialog slug={slug} templates={templates} defaultOpen={generar === "1"} />
            {hr && <BulkSendDialog slug={slug} employees={employees.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, department: e.department?.name ?? "" }))} />}
          </>
        }
      />
      <section aria-labelledby="mine-title" className="flex flex-col gap-3">
        <h2 id="mine-title" className="text-sm font-semibold">
          Mis documentos
        </h2>
        <DocumentsTable docs={mine} slug={slug} canSign />
      </section>

      {hr && (
        <section aria-labelledby="report-title" className="mt-10 flex flex-col gap-4">
          <div>
            <h2 id="report-title" className="text-lg font-semibold">
              Firmas pendientes en la empresa
            </h2>
            <p className="text-sm text-muted-foreground">Avance de firma por documento enviado.</p>
          </div>
          <SignaturesReport docs={all} />
          <DocumentsTable docs={all.filter((d) => d.employee_id !== ctx.employee.id)} slug={slug} canSign={false} showEmployee />
        </section>
      )}
    </>
  )
}
