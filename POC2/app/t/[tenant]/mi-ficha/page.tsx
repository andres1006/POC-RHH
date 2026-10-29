import { getTenantContext } from "@/lib/tenant"
import { EmployeeProfile } from "@/components/profile/employee-profile"

export const metadata = { title: "Mi ficha" }

export default async function MyProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  return <EmployeeProfile ctx={ctx} employee={ctx.employee} isSelf />
}
