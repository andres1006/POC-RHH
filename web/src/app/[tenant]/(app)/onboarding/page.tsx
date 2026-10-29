import { Check } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listOnboardings, type OnboardingView } from '@/server/services/onboarding'
import { listEmployees } from '@/server/services/people'
import { hireEmployee, toggleTask } from '@/server/actions'
import { can } from '@/platform/rbac'
import { fullName, today } from '@/platform/format'
import { ActionForm, Field } from '@/platform/action-form'
import { Avatar, Badge, Card, CardTitle, Empty, PageHeader, cx, field, fmtDate } from '@/platform/ui'

const progress = (o: OnboardingView) => Math.round((o.tasks.filter((t) => t.doneAt).length / Math.max(o.tasks.length, 1)) * 100)

function Checklist({ o, slug }: { o: OnboardingView; slug: string }) {
  const now = today()
  return (
    <ul className="divide-y divide-line">
      {o.tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2.5">
          <form action={toggleTask}>
            <input type="hidden" name="tenant" value={slug} />
            <input type="hidden" name="task" value={t.id} />
            <button aria-label={t.doneAt ? `Marcar pendiente: ${t.title}` : `Completar: ${t.title}`}
              className={cx('flex size-6 items-center justify-center rounded-full border-2 transition', t.doneAt ? 'border-primary bg-primary text-white' : 'border-line hover:border-primary')}>
              {t.doneAt && <Check className="size-3.5" strokeWidth={3} />}
            </button>
          </form>
          <div className="min-w-0 flex-1 text-sm">
            <p className={cx(t.doneAt && 'text-muted line-through')}>{t.title}</p>
            <p className="text-xs text-muted">{t.owner} · vence {fmtDate(t.due)}</p>
          </div>
          {!t.doneAt && t.due < now && <Badge tone="danger">Vencida</Badge>}
        </li>
      ))}
    </ul>
  )
}

export default async function OnboardingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const isHr = can(ctx.user.role, 'people.read_all')
  const [all, people] = await Promise.all([listOnboardings(ctx), isHr ? listEmployees(ctx) : Promise.resolve([])])
  const own = all.find((o) => o.employeeId === ctx.user.employeeId)
  const others = all.filter((o) => o !== own)
  const leaders = people.filter((e) => e.role !== 'employee')

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" subtitle="Que cada persona nueva llegue con todo listo desde el primer día" />

      {own && (
        <Card>
          <CardTitle action={<Badge tone="primary">{progress(own)} % completado</Badge>}>¡Bienvenido a {ctx.tenant.name}, {ctx.user.firstName}! 👋</CardTitle>
          <div className="mb-4 h-2 rounded-full bg-fill"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress(own)}%` }} /></div>
          <Checklist o={own} slug={slug} />
        </Card>
      )}

      {others.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {others.map((o) => {
            const p = progress(o)
            const late = o.tasks.filter((t) => !t.doneAt && t.due < today()).length
            return (
              <Card key={o.id} className="min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(o.employee)} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{fullName(o.employee)}</p>
                    <p className="truncate text-xs text-muted">{o.employee.position} · inicia {fmtDate(o.startDate)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted">{o.tasks.filter((t) => t.doneAt).length} de {o.tasks.length} tareas</span>
                  {late > 0 ? <Badge tone="danger">{late} vencida{late > 1 ? 's' : ''}</Badge> : <span className="font-semibold text-primary">{p} %</span>}
                </div>
                <div className="mt-2 h-2 rounded-full bg-fill"><div className="h-2 rounded-full bg-primary" style={{ width: `${p}%` }} /></div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Ver tareas</summary>
                  <Checklist o={o} slug={slug} />
                </details>
              </Card>
            )
          })}
        </div>
      )}

      {!own && others.length === 0 && <Card><Empty title="No hay ingresos en curso" text="Cuando llegue alguien nuevo a tu equipo lo verás aquí" /></Card>}

      {isHr && (
        <Card className="max-w-xl">
          <CardTitle>Registrar nuevo ingreso</CardTitle>
          <ActionForm action={hireEmployee} tenant={slug} submit="Crear y asignar onboarding" success="Ingreso registrado con su ruta de onboarding. Dale acceso desde Configuración → Usuarios.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombres"><input name="firstName" required className={field} /></Field>
              <Field label="Apellidos"><input name="lastName" required className={field} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cargo"><input name="position" required className={field} /></Field>
              <Field label="Correo corporativo"><input type="email" name="email" required className={field} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Líder">
                <select name="managerId" required className={field}>
                  {leaders.map((l) => <option key={l.id} value={l.id}>{fullName(l)} · {l.department}</option>)}
                </select>
              </Field>
              <Field label="Fecha de inicio"><input type="date" name="startDate" required defaultValue={today()} className={field} /></Field>
            </div>
          </ActionForm>
        </Card>
      )}
    </div>
  )
}
