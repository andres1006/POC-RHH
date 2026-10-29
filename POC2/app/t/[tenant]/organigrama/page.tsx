import { getTenantContext } from "@/lib/tenant"
import { getEmployees } from "@/lib/data"
import { PageHeader } from "@/components/shared/page-header"
import { OrgChart } from "@/components/directory/org-chart"

export const metadata = { title: "Organigrama" }

export default async function OrgChartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const employees = await getEmployees(ctx.tenant.id)
  return (
    <>
      <PageHeader title="Organigrama" description="Explora la estructura de la empresa. Haz clic en un nodo para expandir o colapsar su equipo." />
      <OrgChart
        slug={slug}
        currentId={ctx.employee.id}
        nodes={employees.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, position: e.position ?? "", avatar_url: e.avatar_url, manager_id: e.manager_id, department: e.department?.name ?? "" }))}
      />
    </>
  )
}
