import { getTenantContext } from "@/lib/tenant"
import { getDepartments, getEmployees } from "@/lib/data"
import { PageHeader } from "@/components/shared/page-header"
import { DirectoryGrid } from "@/components/directory/directory-grid"

export const metadata = { title: "Directorio" }

export default async function DirectoryPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const [employees, departments] = await Promise.all([getEmployees(ctx.tenant.id), getDepartments(ctx.tenant.id)])
  return (
    <>
      <PageHeader title="Directorio" description={`${employees.length} personas en ${ctx.tenant.name}`} />
      <DirectoryGrid
        slug={slug}
        departments={departments}
        employees={employees.map((e) => ({ id: e.id, first_name: e.first_name, last_name: e.last_name, avatar_url: e.avatar_url, position: e.position, email: e.email, department: e.department?.name ?? "—" }))}
      />
    </>
  )
}
