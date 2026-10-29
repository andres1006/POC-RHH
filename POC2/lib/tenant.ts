import { cache } from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Employee, Role, Tenant, TenantContext } from "@/lib/types"
import { brandedTenant } from "@/lib/brand"

export const getTenantContext = cache(async (slug: string): Promise<TenantContext> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/t/${slug}`)

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).maybeSingle()
  if (!tenant) notFound()

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, employee_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) redirect("/sin-acceso")

  const { data: employee } = await supabase
    .from("employees")
    .select("*, department:departments(name)")
    .eq("id", membership.employee_id)
    .single()

  return {
    tenant: brandedTenant(tenant as Tenant),
    role: membership.role as Role,
    employee: employee as Employee,
    userId: user.id,
  }
})

export const getUserTenants = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from("memberships").select("role, tenant:tenants(id, slug, name, logo_url, primary_color)").eq("user_id", user.id)
  return ((data ?? []) as unknown as { role: Role; tenant: Tenant }[]).map((row) => ({
    ...row,
    tenant: brandedTenant(row.tenant),
  }))
})

export function can(role: Role, ...allowed: Role[]) {
  return allowed.includes(role)
}

export const isManagerRole = (role: Role) => role === "leader" || role === "hr" || role === "admin"
export const isHrRole = (role: Role) => role === "hr" || role === "admin"

export function moduleOn(tenant: Tenant, key: string) {
  return tenant.modules?.[key] !== false
}
