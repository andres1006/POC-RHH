import { notFound } from 'next/navigation'
import { requireCtx } from '@/server/session'
import { listAccess } from '@/server/services/admin'
import { changeRole } from '@/server/actions'
import { ROLE_LABEL, can, type Role } from '@/platform/rbac'
import { fullName } from '@/platform/format'
import { Avatar, Card, CardTitle, PageHeader, Segmented, field } from '@/platform/ui'
import { BrandForm } from '@/modules/settings/brand-form'
import { AccessCell } from '@/modules/settings/grant-access'

export default async function Configuracion({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  if (!can(ctx.user.role, 'tenant.configure')) notFound()
  const { tab = 'usuarios', q = '' } = await searchParams
  const rows = tab === 'usuarios' ? await listAccess(ctx) : []
  const shown = rows.filter(({ e }) => `${fullName(e)} ${e.position} ${e.email}`.toLowerCase().includes(q.toLowerCase()))
  const withAccess = rows.filter((r) => r.userId).length

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" subtitle={`Usuarios, roles y marca de ${ctx.tenant.name}`} />
      <Segmented active={tab} items={[{ key: 'usuarios', label: 'Usuarios y roles', href: '?tab=usuarios' }, { key: 'marca', label: 'Marca', href: '?tab=marca' }]} />

      {tab === 'marca' && (
        <Card>
          <CardTitle>Marca de la empresa</CardTitle>
          <BrandForm tenant={slug} name={ctx.tenant.name} color={ctx.tenant.primaryColor} />
        </Card>
      )}

      {tab === 'usuarios' && (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <p className="text-sm text-muted"><b className="text-fg">{withAccess}</b> de {rows.length} personas tienen acceso. Para agregar personas usa <b className="text-fg">Onboarding → Registrar nuevo ingreso</b>.</p>
            <form role="search">
              <input type="hidden" name="tab" value="usuarios" />
              <input name="q" defaultValue={q} placeholder="Buscar persona" aria-label="Buscar persona" className={`${field} w-56`} />
            </form>
          </div>
          <ul className="divide-y divide-line">
            {shown.map(({ e, userId, mustChange }) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <Avatar name={fullName(e)} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{fullName(e)}</span>
                  <span className="block truncate text-xs text-muted">{e.position} · {e.email}</span>
                </span>
                {/* key con el rol: tras guardar, el select se vuelve a montar con el valor nuevo */}
                <form key={e.role} action={changeRole} className="flex items-center gap-2">
                  <input type="hidden" name="tenant" value={slug} />
                  <input type="hidden" name="employee" value={e.id} />
                  <label className="sr-only" htmlFor={`role-${e.id}`}>Rol de {fullName(e)}</label>
                  <select id={`role-${e.id}`} name="role" defaultValue={e.role} disabled={e.id === ctx.user.employeeId} className={`${field} w-36 py-1.5 text-sm`}>
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  {e.id !== ctx.user.employeeId && <button className="text-xs font-medium text-primary">Guardar</button>}
                </form>
                <span className="w-56 text-right">
                  <AccessCell tenant={slug} employee={e.id} hasAccess={!!userId} mustChange={!!mustChange} self={e.id === ctx.user.employeeId} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
