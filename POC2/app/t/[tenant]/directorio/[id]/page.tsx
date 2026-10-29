import { notFound } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { getEmployee } from "@/lib/data"
import { EmployeeProfile } from "@/components/profile/employee-profile"

export default async function EmployeePage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant: slug, id } = await params
  const ctx = await getTenantContext(slug)
  const employee = await getEmployee(id)
  if (!employee || employee.tenant_id !== ctx.tenant.id) notFound()
  return <EmployeeProfile ctx={ctx} employee={employee} isSelf={employee.id === ctx.employee.id} />
}
