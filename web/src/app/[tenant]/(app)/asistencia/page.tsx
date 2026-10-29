import { LogIn, LogOut } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listMyMarks, teamAttendance } from '@/server/services/operations'
import { clock } from '@/server/actions'
import { can } from '@/platform/rbac'
import { fullName, nowLocal } from '@/platform/format'
import { Avatar, Badge, Card, CardTitle, Empty, PageHeader, Stat, btn, cx } from '@/platform/ui'

const SHIFTS = [
  { key: 'M', label: 'Mañana', hours: '06:00–14:00', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
  { key: 'T', label: 'Tarde', hours: '14:00–22:00', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
  { key: 'O', label: 'Oficina', hours: '08:00–17:00', cls: 'bg-primary/12 text-primary' },
  { key: 'D', label: 'Descanso', hours: '', cls: 'bg-fill text-muted' },
]

// shortcut: turnos derivados de forma determinista; siguiente paso, tabla `shifts` editable por el líder.
const shiftFor = (employeeIdx: number, dayIdx: number, dept: string) =>
  dept === 'Operaciones' ? (dayIdx === 6 || (dayIdx + employeeIdx) % 7 === 5 ? SHIFTS[3] : SHIFTS[(employeeIdx + Math.floor(dayIdx / 3)) % 2]) : dayIdx >= 5 ? SHIFTS[3] : SHIFTS[2]

const time = (iso: string) => iso.slice(11, 16)
const LATE_AFTER = '08:10'

export default async function Asistencia({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const isLead = can(ctx.user.role, 'requests.approve')
  const [mine, teamData] = await Promise.all([listMyMarks(ctx), isLead ? teamAttendance(ctx) : Promise.resolve(null)])
  const now = nowLocal()
  const last = mine[0]
  const nextKind = last?.kind === 'in' && last.at.slice(0, 10) === now.slice(0, 10) ? 'out' : 'in'
  const days = [...new Set(mine.map((m) => m.at.slice(0, 10)))].slice(0, 5)

  const team = teamData?.team ?? []
  const lates = teamData?.marks.filter((m) => m.kind === 'in' && time(m.at) > LATE_AFTER).length ?? 0
  const overtime = teamData?.marks.filter((m) => m.kind === 'out' && m.at.slice(11, 13) >= '19').length ?? 0
  const monday = new Date(`${now.slice(0, 10)}T12:00:00`)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d })

  return (
    <div className="space-y-6">
      <PageHeader title="Asistencia y turnos" subtitle="Marca tu jornada y revisa los turnos de tu equipo" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="text-center">
          <p className="text-sm text-muted">{new Date(`${now.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">{time(now)}</p>
          <p className="mt-1 text-xs text-muted">Hora de Colombia · sede principal</p>
          <form action={clock} className="mt-6">
            <input type="hidden" name="tenant" value={slug} />
            <button className={cx(nextKind === 'out' ? btn.primary.replace('bg-primary', 'bg-rose-600') : btn.primary, 'w-full py-3 text-base')}>
              {nextKind === 'in' ? <><LogIn className="size-5" aria-hidden /> Marcar entrada</> : <><LogOut className="size-5" aria-hidden /> Marcar salida</>}
            </button>
          </form>
          {last && <p className="mt-3 text-xs text-muted">Última marca: {last.kind === 'in' ? 'entrada' : 'salida'} {last.at.slice(0, 10)} a las {time(last.at)}</p>}
        </Card>

        <Card className="min-w-0">
          <CardTitle>Mis últimas jornadas</CardTitle>
          {days.length === 0 ? <Empty title="Sin marcas todavía" text="Marca tu entrada para empezar" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-medium">Día</th><th className="font-medium">Entrada</th><th className="font-medium">Salida</th><th className="font-medium">Estado</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {days.map((d) => {
                    const ins = mine.filter((m) => m.at.startsWith(d) && m.kind === 'in')
                    const inM = ins.at(-1)
                    const outM = mine.find((m) => m.at.startsWith(d) && m.kind === 'out')
                    const late = inM && time(inM.at) > LATE_AFTER
                    return (
                      <tr key={d}>
                        <td className="py-2.5">{new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td className="tabular-nums">{inM ? time(inM.at) : '—'}</td>
                        <td className="tabular-nums">{outM ? time(outM.at) : '—'}</td>
                        <td>{late ? <Badge tone="warning">Retraso</Badge> : <Badge tone="success">A tiempo</Badge>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {isLead && team.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Personas en turno" value={team.length} />
            <Stat label="Retrasos recientes" value={lates} />
            <Stat label="Horas extra por aprobar" value={overtime} hint="salidas después de las 7 p. m." />
          </div>
          <Card>
            <CardTitle action={<div className="hidden gap-2 sm:flex">{SHIFTS.map((s) => <span key={s.key} className={cx('rounded-md px-2 py-0.5 text-xs', s.cls)}>{s.label} {s.hours}</span>)}</div>}>Turnos de la semana</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr>
                  <th className="py-2 text-left text-xs font-medium text-muted">Persona</th>
                  {week.map((d) => <th key={d.toISOString()} className="text-xs font-medium text-muted">{d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })}</th>)}
                </tr></thead>
                <tbody>
                  {team.map((p, pi) => (
                    <tr key={p.id}>
                      <td className="py-1.5 pr-3"><span className="flex items-center gap-2"><Avatar name={fullName(p)} size={26} /><span className="whitespace-nowrap">{p.firstName} {p.lastName.split(' ')[0]}</span></span></td>
                      {week.map((_, di) => { const s = shiftFor(pi, di, p.department); return <td key={di} className="p-1"><div className={cx('rounded-lg py-1.5 text-center text-xs font-medium', s.cls)} title={`${s.label} ${s.hours}`}>{s.label}</div></td> })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
