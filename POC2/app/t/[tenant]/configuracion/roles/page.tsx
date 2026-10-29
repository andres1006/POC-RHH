import { notFound } from "next/navigation"
import { getMemberships } from "@/lib/data"
import { getTenantContext } from "@/lib/tenant"
import { PageHeader } from "@/components/shared/page-header"
import { RolesTable, type MemberRow } from "@/components/settings/roles-table"
import { Card } from "@/components/ui/card"
import type { Role } from "@/lib/types"

export const metadata = { title: "Roles" }

export default async function RolesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (ctx.role !== "admin") notFound()

  const rows = (await getMemberships(ctx.tenant.id)) as {
    id: string
    role: Role
    employee: MemberRow["employee"] | NonNullable<MemberRow["employee"]>[] | null
  }[]

  const members: MemberRow[] = rows
    .map((row) => ({
      id: row.id,
      role: row.role,
      employee: Array.isArray(row.employee) ? (row.employee[0] ?? null) : row.employee,
    }))
    .sort((a, b) => (a.employee?.last_name ?? "").localeCompare(b.employee?.last_name ?? "", "es"))

  return (
    <>
      <PageHeader title="Roles" description="Define quién es empleado, líder, RR. HH. o administrador. Tu propio rol no se puede cambiar desde aquí." />
      <Card className="p-0">
        <RolesTable slug={slug} members={members} currentEmployeeId={ctx.employee.id} />
      </Card>
    </>
  )
}
