import type { CSSProperties, ReactNode } from "react"
import { cookies } from "next/headers"
import { getTenantContext, getUserTenants } from "@/lib/tenant"
import { getNotifications } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { SensitiveProvider } from "@/components/shell/sensitive-context"
import { AppShell } from "@/components/shell/app-shell"

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const ctx = await getTenantContext(tenant)
  return { title: { default: ctx.tenant.name, template: `%s · ${ctx.tenant.name}` } }
}

export default async function TenantLayout({ children, params }: { children: ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const [notifications, tenants, cookieStore, { data: people }] = await Promise.all([
    getNotifications(ctx.employee.id),
    getUserTenants(),
    cookies(),
    supabase.from("employees").select("id, first_name, last_name, position").eq("tenant_id", ctx.tenant.id).eq("status", "active").order("last_name"),
  ])
  const hidden = cookieStore.get("nexo_hide_sensitive")?.value === "1"

  const { sensitive: _sensitive, ...employee } = ctx.employee

  return (
    <div className="tenant-theme min-h-dvh" style={{ "--brand": ctx.tenant.primary_color } as CSSProperties}>
      <SensitiveProvider initial={hidden}>
        <AppShell
          tenant={ctx.tenant}
          role={ctx.role}
          employee={employee}
          notifications={notifications}
          tenants={tenants.map((t) => ({ slug: t.tenant.slug, name: t.tenant.name, role: t.role }))}
          people={people ?? []}
        >
          {children}
        </AppShell>
      </SensitiveProvider>
    </div>
  )
}
