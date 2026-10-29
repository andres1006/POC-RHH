import Link from 'next/link'
import { requireCtx } from '@/server/session'
import { getBalance, listRequests } from '@/server/services/requests'
import { listEmployees } from '@/server/services/people'
import { cancelRequest } from '@/server/actions'
import { can } from '@/platform/rbac'
import { fullName, today } from '@/platform/format'
import { Avatar, Badge, Card, CardTitle, Empty, PageHeader, STATUS, Stat, btn, cx, fmtDate } from '@/platform/ui'
import { DecisionButtons } from '@/modules/requests/decision-buttons'
import { VacationForm } from '@/modules/leave/request-form'
import { PermissionForm } from '@/modules/leave/permission-form'
import { HOLIDAYS_CO } from '@/modules/leave/domain'

export default async function Vacaciones({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ mes?: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const [b, visible, awaiting, people] = await Promise.all([getBalance(ctx), listRequests(ctx), listRequests(ctx, 'to_approve'), listEmployees(ctx)])
  const leave = (r: (typeof visible)[number]) => r.type === 'vacation' || r.type === 'permission'
  const mine = visible.filter((r) => r.requesterId === ctx.user.employeeId && leave(r))
  const pendingLeave = awaiting.filter(leave)
  const isLeader = can(ctx.user.role, 'requests.approve')
  const team = people.filter((e) => e.managerId === ctx.user.employeeId)
  const byId = new Map(people.map((e) => [e.id, e]))

  // Calendario del mes para el equipo del líder
  const mes = (await searchParams).mes
  const now = /^\d{4}-\d{2}$/.test(mes ?? '') ? new Date(Number(mes!.slice(0, 4)), Number(mes!.slice(5)) - 1, 1) : new Date()
  const y = now.getFullYear(), m = now.getMonth()
  const monthParam = (delta: number) => { const d = new Date(y, m + delta, 1); return `?mes=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const dayIso = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const teamReqs = visible.filter((r) => leave(r) && team.some((t) => t.id === r.requesterId) && (r.status === 'approved' || r.status === 'pending'))

  return (
    <div className="space-y-6">
      <PageHeader title="Vacaciones y permisos" subtitle="Consulta tu saldo, solicita días y sigue tus aprobaciones" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Disponibles" value={b.available.toLocaleString('es-CO')} hint="días hábiles" />
        <Stat label="Acumuladas" value={b.accrued.toLocaleString('es-CO')} hint="15 por año trabajado" />
        <Stat label="Tomadas" value={b.taken} />
        <Stat label="En aprobación" value={b.scheduled} />
      </div>

      {isLeader && (
        <Card>
          <CardTitle action={<Badge tone="warning">{pendingLeave.length} por aprobar</Badge>}>Aprobaciones de mi equipo</CardTitle>
          {pendingLeave.length === 0 ? <Empty title="¡Todo al día!" text="No tienes solicitudes pendientes" /> : (
            <ul className="divide-y divide-line">
              {pendingLeave.map((r) => {
                const who = byId.get(r.requesterId)!
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Avatar name={fullName(who)} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium">{fullName(who)}</p>
                      <p className="text-muted">{r.title} · {r.payload.from === r.payload.to ? fmtDate(r.payload.from!) : `${fmtDate(r.payload.from!)} → ${fmtDate(r.payload.to!)}`}</p>
                    </div>
                    <DecisionButtons tenant={slug} id={r.id} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}

      {isLeader && team.length > 0 && (
        <Card>
          <CardTitle action={<span className="flex gap-1"><Link scroll={false} href={monthParam(-1)} className={btn.ghost} aria-label="Mes anterior">‹</Link><Link scroll={false} href={monthParam(1)} className={btn.ghost} aria-label="Mes siguiente">›</Link></span>}>
            Calendario del equipo · {now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface pr-3 text-left font-medium text-muted">Persona</th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dow = new Date(y, m, i + 1).getDay()
                    return <th key={i} className={cx('w-6 min-w-6 text-center font-normal', dow === 0 || dow === 6 || HOLIDAYS_CO.has(dayIso(i + 1)) ? 'text-muted/50' : 'text-muted')}>{i + 1}</th>
                  })}
                </tr>
              </thead>
              <tbody>
                {team.map((p) => (
                  <tr key={p.id}>
                    <td className="sticky left-0 whitespace-nowrap bg-surface py-1.5 pr-3">{p.firstName} {p.lastName.split(' ')[0]}</td>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = dayIso(i + 1)
                      const r = teamReqs.find((x) => x.requesterId === p.id && x.payload.from! <= d && d <= x.payload.to!)
                      return <td key={i} className="p-0.5"><div className={cx('h-5 rounded', r ? (r.status === 'approved' ? 'bg-primary' : 'bg-primary/35') : 'bg-bg')} title={r ? `${STATUS[r.status].label}: ${r.title}` : undefined} /></td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-primary" /> Aprobadas</span>
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-primary/35" /> Pendientes</span>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardTitle>Solicitar vacaciones</CardTitle>
            <VacationForm tenant={slug} available={b.available} minDate={today()} />
          </Card>
          <Card>
            <div id="permiso" className="scroll-mt-20" />
            <CardTitle>Solicitar permiso</CardTitle>
            <PermissionForm tenant={slug} minDate={today()} />
          </Card>
        </div>
        <Card className="h-fit min-w-0">
          <CardTitle>Mis solicitudes</CardTitle>
          {mine.length === 0 ? <Empty title="Aún no tienes solicitudes" text="Cuando pidas vacaciones o permisos los verás aquí" /> : (
            <ul className="divide-y divide-line text-sm">
              {mine.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-muted">{r.payload.from === r.payload.to ? fmtDate(r.payload.from!) : `${fmtDate(r.payload.from!)} → ${fmtDate(r.payload.to!)}`}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    {r.status === 'pending' && (
                      <form action={cancelRequest}>
                        <input type="hidden" name="tenant" value={slug} />
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-xs text-muted underline-offset-2 hover:text-rose-600 hover:underline">Cancelar</button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
