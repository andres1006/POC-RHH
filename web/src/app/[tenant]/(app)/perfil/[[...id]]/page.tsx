import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { AppError } from '@/server/context'
import { getEmployee } from '@/server/services/people'
import { getBalance, listRequests } from '@/server/services/requests'
import { requestDataChange } from '@/server/actions'
import { fullName, today } from '@/platform/format'
import { ActionForm, Field } from '@/platform/action-form'
import { Avatar, Badge, Card, CardTitle, STATUS, Segmented, btn, cx, field, fmtCOP, fmtDate } from '@/platform/ui'

const TABS = [['resumen', 'Resumen'], ['historia', 'Historia'], ['vacaciones', 'Vacaciones']] as const

export default async function Perfil({ params, searchParams }: { params: Promise<{ tenant: string; id?: string[] }>; searchParams: Promise<{ tab?: string }> }) {
  const p = await params
  const ctx = await requireCtx(p.tenant)
  const id = p.id?.[0] ?? ctx.user.employeeId
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const profile = await getEmployee(ctx, id).catch((e) => { if (e instanceof AppError && e.status === 404) notFound(); throw e })
  const { employee: e, manager, events, sensitive } = profile
  const own = e.id === ctx.user.employeeId
  const tab = (await searchParams).tab ?? 'resumen'
  const [b, reqs] = await Promise.all([getBalance(ctx, e.id), own ? listRequests(ctx, 'mine') : Promise.resolve([])])
  const vacations = reqs.filter((r) => r.type === 'vacation')
  const years = Math.max(0, (Date.parse(today()) - Date.parse(e.hireDate)) / 31_557_600_000).toFixed(1)

  const Row = ({ k, v, s }: { k: string; v: React.ReactNode; s?: boolean }) => (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd className={cx('min-w-0 break-words', s && 'sensitive')}>{v}</dd>
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit min-w-0 text-center">
        <div className="flex justify-center"><Avatar name={fullName(e)} size={88} /></div>
        <h1 className="mt-3 text-lg font-semibold">{fullName(e)}</h1>
        <p className="text-sm text-muted">{e.position}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2"><Badge tone="primary">{e.department}</Badge><Badge>{ctx.tenant.name}</Badge></div>
        {own && <Link href="?tab=editar" className={`${btn.ghost} mt-4`}><Pencil className="size-4" aria-hidden /> Actualizar datos</Link>}
        <dl className="mt-5 border-t border-line pt-3 text-left">
          <Row k="Correo" v={e.email} />
          {sensitive && <>
            <Row k="Teléfono" v={e.phone || '—'} s />
            <Row k="Documento" v={e.documentId ? `CC ${e.documentId}` : '—'} s />
            <Row k="EPS" v={e.eps || '—'} s />
            <Row k="Pensión" v={e.pension || '—'} s />
            <Row k="Salario" v={e.salary ? fmtCOP(e.salary) : '—'} s />
          </>}
        </dl>
      </Card>

      <Card className="min-w-0 p-0">
        <div className="border-b border-line p-3">
          <Segmented active={tab} items={TABS.filter(([k]) => k !== 'vacaciones' || own).map(([k, label]) => ({ key: k, label, href: `?tab=${k}` }))} />
        </div>
        <div className="p-5">
          {tab === 'resumen' && (
            <dl className="divide-y divide-line">
              <Row k="Cargo" v={e.position} />
              <Row k="Área" v={e.department} />
              <Row k="Supervisor" v={manager ? <Link className="text-primary hover:underline" href={`/${p.tenant}/perfil/${manager.id}`}>{fullName(manager)}</Link> : '—'} />
              <Row k="Contrato" v={e.contractType} />
              <Row k="Jornada" v="Lunes a viernes · 44 h semanales" />
              <Row k="Ingreso" v={`${fmtDate(e.hireDate)} (${years} años)`} />
              <Row k="Vacaciones" v={`${b.available.toLocaleString('es-CO')} días disponibles`} />
            </dl>
          )}
          {tab === 'historia' && (
            <ol className="relative ml-3 border-l border-line">
              {events.map((ev) => (
                <li key={ev.id} className="mb-6 ml-6">
                  <span className="absolute -left-2 mt-1 size-4 rounded-full border-2 border-surface bg-primary" />
                  <p className="text-xs text-muted">{fmtDate(ev.date)}</p>
                  <p className="font-medium">{ev.kind}</p>
                  <dl className="mt-2 rounded-xl bg-bg p-3 text-sm">
                    {ev.changes.map(([k, from, to]) => (
                      <div key={k} className="flex flex-wrap gap-2"><dt className="text-muted">{k}:</dt><dd className="sensitive">{from} → <b>{to}</b></dd></div>
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
          )}
          {tab === 'editar' && own && (
            <div className="max-w-md">
              <CardTitle>Actualizar datos</CardTitle>
              <p className="-mt-2 mb-4 text-sm text-muted">Los cambios se envían a RR. HH. para aprobación. Documento, correo corporativo y fecha de ingreso solo los modifica RR. HH.</p>
              <ActionForm action={requestDataChange} tenant={p.tenant} submit="Enviar a aprobación" success="Solicitud enviada a RR. HH.">
                <Field label="Documento"><input value={e.documentId ? `CC ${e.documentId}` : '—'} disabled className={`${field} opacity-60`} /></Field>
                <Field label="Correo corporativo"><input value={e.email} disabled className={`${field} opacity-60`} /></Field>
                <Field label="Teléfono personal"><input name="phone" defaultValue={e.phone} required className={field} inputMode="tel" /></Field>
              </ActionForm>
            </div>
          )}
          {tab === 'vacaciones' && own && (
            <div className="space-y-4">
              <CardTitle>Saldo al {fmtDate(today())}</CardTitle>
              <dl className="divide-y divide-line">
                <Row k="(+) Acumuladas" v={b.accrued} />
                <Row k="(−) Tomadas" v={b.taken} />
                <Row k="(−) En aprobación" v={b.scheduled} />
                <Row k="(=) Disponibles" v={<b>{b.available}</b>} />
              </dl>
              <ul className="divide-y divide-line text-sm">
                {vacations.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 py-2">
                    <span>{fmtDate(r.payload.from!)} → {fmtDate(r.payload.to!)} · {r.payload.days} días</span>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
