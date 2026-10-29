import { requireCtx } from '@/server/session'
import { listRequests } from '@/server/services/requests'
import { listEmployees } from '@/server/services/people'
import { can } from '@/platform/rbac'
import { fullName } from '@/platform/format'
import { Avatar, Badge, Card, Empty, PageHeader, STATUS, Segmented, Stat, fmtDate } from '@/platform/ui'
import { REQUEST_TYPE_LABEL, isAwaiting, type HrRequest } from '@/modules/requests/domain'
import { DecisionButtons } from '@/modules/requests/decision-buttons'
import { CatalogBrowser } from '@/modules/requests/catalog-browser'

type Tab = 'pendientes' | 'mias' | 'todas'

const detail = (r: HrRequest) =>
  r.type === 'vacation' ? `${r.payload.days} días · ${fmtDate(r.payload.from!)} → ${fmtDate(r.payload.to!)}`
    : r.type === 'permission' ? `${r.title} · ${fmtDate(r.payload.from!)}`
      : r.payload.changes ? `Teléfono → ${r.payload.changes.phone}` : r.title

export default async function Solicitudes({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ tab?: Tab }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const [all, people] = await Promise.all([listRequests(ctx), listEmployees(ctx)])
  const me = ctx.user.employeeId
  const tabs: { key: Tab; label: string }[] = [
    ...(can(ctx.user.role, 'requests.approve') ? [{ key: 'pendientes' as Tab, label: 'Por aprobar' }] : []),
    { key: 'mias', label: 'Mis solicitudes' },
    ...(can(ctx.user.role, 'requests.view_all') ? [{ key: 'todas' as Tab, label: 'Todas' }] : []),
  ]
  const requested = (await searchParams).tab
  const tab = tabs.some((t) => t.key === requested) ? requested! : tabs[0].key
  const rows = tab === 'pendientes' ? all.filter((r) => isAwaiting(r as HrRequest, me)) : tab === 'mias' ? all.filter((r) => r.requesterId === me) : all
  const count = (s: string) => all.filter((r) => r.status === s).length
  const byId = new Map(people.map((e) => [e.id, e]))

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogo de servicios" subtitle="Selecciona el servicio que quieres comenzar o revisa los trámites que ya enviaste." />
      <CatalogBrowser tenant={slug} />
      <h2 className="text-[22px] font-semibold">Trámites</h2>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="En curso" value={count('pending')} />
        <Stat label="Aprobadas" value={count('approved')} />
        <Stat label="Rechazadas" value={count('rejected')} />
      </div>
      <Card className="p-0">
        <div className="border-b border-line p-3">
          <Segmented active={tab} items={tabs.map((t) => ({ key: t.key, label: t.label, href: `?tab=${t.key}` }))} />
        </div>
        {rows.length === 0 ? <Empty title="Aún no hay datos" text="Cuando haya solicitudes podrás verlas aquí" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-medium">Solicitante</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Creada</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const who = byId.get(r.requesterId)
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3"><span className="flex items-center gap-2">{who && <Avatar name={fullName(who)} size={28} />}<span className="whitespace-nowrap">{who ? fullName(who) : '—'}</span></span></td>
                      <td className="px-4 py-3">{REQUEST_TYPE_LABEL[r.type]}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{detail(r as HrRequest)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                      <td className="px-4 py-3">{isAwaiting(r as HrRequest, me) && <DecisionButtons tenant={slug} id={r.id} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
