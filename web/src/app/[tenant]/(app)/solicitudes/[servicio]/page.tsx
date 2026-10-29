import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listRequests } from '@/server/services/requests'
import { listEmployees } from '@/server/services/people'
import { can } from '@/platform/rbac'
import { Card, Segmented, Stat, cx } from '@/platform/ui'
import { isAwaiting, type HrRequest } from '@/modules/requests/domain'
import { findService, matchesService } from '@/modules/requests/catalog'
import { CatalogCreateForm } from '@/modules/requests/catalog-create-form'
import { RequestTable } from '@/modules/requests/request-table'

type Tab = 'pendientes' | 'mias' | 'todas'

export default async function Servicio({
  params, searchParams,
}: {
  params: Promise<{ tenant: string; servicio: string }>
  searchParams: Promise<{ tab?: Tab }>
}) {
  const { tenant: slug, servicio } = await params
  const service = findService(servicio)
  if (!service) notFound()
  const ctx = await requireCtx(slug)
  const [all, people] = await Promise.all([listRequests(ctx), listEmployees(ctx)])
  const ofType = all.filter((r) => matchesService(r as HrRequest, service)) as HrRequest[]
  const me = ctx.user.employeeId
  const tabs: { key: Tab; label: string }[] = [
    ...(can(ctx.user.role, 'requests.approve') ? [{ key: 'pendientes' as Tab, label: 'Por aprobar' }] : []),
    { key: 'mias', label: 'Mis solicitudes' },
    ...(can(ctx.user.role, 'requests.view_all') ? [{ key: 'todas' as Tab, label: 'Todas' }] : []),
  ]
  const requested = (await searchParams).tab
  const tab = tabs.some((t) => t.key === requested) ? requested! : (tabs.find((t) => t.key === 'todas') ?? tabs.find((t) => t.key === 'mias') ?? tabs[0]).key
  const rows = tab === 'pendientes' ? ofType.filter((r) => isAwaiting(r, me)) : tab === 'mias' ? ofType.filter((r) => r.requesterId === me) : ofType
  const count = (s: string) => ofType.filter((r) => r.status === s).length
  const byId = new Map(people.map((e) => [e.id, e]))
  const navy = service.variant === 'navy'

  return (
    <div className="space-y-6">
      <Link href={`/${slug}/solicitudes`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Catálogo de servicios
      </Link>
      <div className={cx('overflow-hidden rounded-[18px] border border-line', navy && 'bg-[#163E73] text-white')}>
        <div className={cx('relative h-40 sm:h-48', navy && 'bg-[#163E73]')}>
          <img src={service.photo} alt="" className={cx('h-full w-full', navy ? 'object-cover object-right' : 'object-cover object-left')} />
        </div>
        <div className="p-5">
          <h1 className="text-[32px] font-bold leading-tight">{service.title}</h1>
          <p className={cx('mt-1 text-[15px]', navy ? 'text-white/75' : 'text-muted')}>{service.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <h2 className="mb-3 text-[17px] font-semibold">Nueva solicitud</h2>
          <p className="mb-4 text-sm text-muted">{service.subtitle}</p>
          <CatalogCreateForm tenant={slug} service={service} />
        </Card>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="En curso" value={count('pending')} />
            <Stat label="Aprobadas" value={count('approved')} />
            <Stat label="Rechazadas" value={count('rejected')} />
          </div>
          <Card className="p-0">
            <div className="border-b border-line p-3">
              <Segmented active={tab} items={tabs.map((t) => ({ key: t.key, label: t.label, href: `?tab=${t.key}` }))} />
            </div>
            <RequestTable tenant={slug} me={me} rows={rows} people={byId} />
          </Card>
        </div>
      </div>
    </div>
  )
}
