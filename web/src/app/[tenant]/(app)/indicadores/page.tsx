import { notFound } from 'next/navigation'
import { requireCtx } from '@/server/session'
import { peopleAnalytics } from '@/server/services/analytics'
import { can } from '@/platform/rbac'
import { Card, CardTitle, PageHeader, Stat } from '@/platform/ui'
import { ByArea, Contracts, Headcount } from '@/modules/analytics/charts'

export default async function Indicadores({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  if (!can(ctx.user.role, 'analytics.view')) notFound()
  const a = await peopleAnalytics(ctx)

  return (
    <div className="space-y-6">
      <PageHeader title="Indicadores de personas" subtitle={`${ctx.tenant.name} · datos al día de hoy`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Headcount" value={a.headcount} hint={`${a.areas} áreas`} />
        <Stat label="Ingresos del año" value={a.hiresThisYear} />
        <Stat label="Solicitudes en curso" value={a.requests.pending} />
        <Stat label="Solicitudes aprobadas" value={a.requests.approved} hint={`de ${a.requests.total} en total`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0"><CardTitle>Personas por área</CardTitle><ByArea data={a.byArea} /></Card>
        <Card className="min-w-0"><CardTitle>Evolución del headcount (12 meses)</CardTitle><Headcount data={a.series} /></Card>
        <Card className="min-w-0">
          <CardTitle>Tipo de contrato</CardTitle>
          <Contracts data={a.contracts} />
          <ul className="flex justify-center gap-4 text-xs text-muted">{a.contracts.map((c) => <li key={c.name}>{c.name}: <b className="text-fg">{c.value}</b></li>)}</ul>
        </Card>
        <Card className="min-w-0">
          <CardTitle>Solicitudes por estado</CardTitle>
          <ul className="space-y-3 text-sm">
            {([['Pendientes', a.requests.pending], ['Aprobadas', a.requests.approved], ['Rechazadas', a.requests.rejected]] as const).map(([label, n]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between"><span>{label}</span><b>{n}</b></div>
                <div className="h-2 rounded-full bg-fill"><div className="h-2 rounded-full bg-primary" style={{ width: `${(n / Math.max(a.requests.total, 1)) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
