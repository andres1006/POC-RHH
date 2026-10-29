import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireCtx } from '@/server/session'
import { navFor } from '@/platform/rbac'
import { fullName } from '@/platform/format'
import { Shell } from '@/platform/shell'
import { tenantBrand } from '@/platform/brand'

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const { tenant, user } = await requireCtx(slug)
  // Cuenta creada por RR. HH. con clave temporal: debe cambiarla antes de usar la plataforma
  if (user.mustChangePassword) redirect(`/${slug}/cuenta`)
  const collapsed = (await cookies()).get('rh_sidebar')?.value === 'collapsed'
  return (
    <div style={{ '--primary': tenant.primaryColor } as React.CSSProperties}>
      <Shell tenant={{ slug, name: tenant.name, ...tenantBrand(slug) }} user={{ name: fullName(user), position: user.position, role: user.role }} nav={navFor(user.role)} collapsed={collapsed}>
        {children}
      </Shell>
    </div>
  )
}
