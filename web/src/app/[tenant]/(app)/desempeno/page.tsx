import { requireCtx } from '@/server/session'
import { nineBox } from '@/server/services/operations'
import { updateObjective } from '@/server/actions'
import { can } from '@/platform/rbac'
import { fullName } from '@/platform/format'
import { Badge, Card, CardTitle, Empty, PageHeader, btn } from '@/platform/ui'
import { NineBox } from '@/modules/performance/nine-box'

export default async function Desempeno({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const { scope, mine, myObjectives, isHr } = await nineBox(ctx)
  // Nuevos ingresos sin evaluación quedan fuera de la matriz hasta su primer ciclo
  const people = scope.flatMap(({ e, r }) => (r ? [{ id: e.id, name: fullName(e), position: e.position, performance: r.performance as 1 | 2 | 3, potential: r.potential as 1 | 2 | 3 }] : []))
  const unrated = scope.length - people.length

  return (
    <div className="space-y-6">
      <PageHeader title="Desempeño" subtitle="Ciclo 2026 · evaluación anual y calibración de talento" />
      {people.length > 0 && (
        <Card>
          <CardTitle action={<Badge tone="primary">{people.length} personas</Badge>}>Matriz de talento 9-box {isHr ? '· toda la empresa' : '· mi equipo'}</CardTitle>
          <p className="-mt-2 mb-4 text-sm text-muted">
            Arrastra a cada persona para calibrarla. Con teclado: tabula hasta su avatar y elige el cuadrante.
            {unrated > 0 && ` ${unrated} persona${unrated > 1 ? 's' : ''} sin evaluar.`}
          </p>
          <NineBox tenant={slug} people={people} editable={can(ctx.user.role, 'requests.approve')} />
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardTitle>Mis objetivos 2026</CardTitle>
          {myObjectives.length === 0 ? <Empty title="Sin objetivos asignados" text="Tu líder los definirá en la conversación de inicio de ciclo" /> : (
            <ul className="space-y-5">
              {myObjectives.map((o) => (
                <li key={o.id} className="text-sm">
                  <div className="mb-1.5 flex justify-between gap-2"><span>{o.title}</span><span className="tabular-nums text-muted">{o.progress} %</span></div>
                  <div className="h-1.5 rounded-full bg-fill"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${o.progress}%` }} /></div>
                  {/* key con el avance: tras guardar, el slider se vuelve a montar con el valor nuevo */}
                  <form key={o.progress} action={updateObjective} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="tenant" value={slug} />
                    <input type="hidden" name="id" value={o.id} />
                    <label className="flex flex-1 items-center gap-2 text-xs text-muted">
                      <span className="sr-only">Avance de {o.title}</span>
                      <input type="range" name="progress" min={0} max={100} step={5} defaultValue={o.progress} className="w-full accent-[var(--primary)]" />
                    </label>
                    <button className={btn.tinted}>Actualizar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {mine && (
          <Card>
            <CardTitle>Mi última evaluación</CardTitle>
            <div className="grid grid-cols-2 gap-3 text-center">
              {([['Desempeño', mine.performance], ['Potencial', mine.potential]] as const).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-bg p-4">
                  <p className="text-xs text-muted">{k}</p>
                  <p className="mt-1 text-2xl font-semibold">{['Bajo', 'Medio', 'Alto'][v - 1]}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">Tu líder compartirá la retroalimentación en la conversación de cierre de ciclo.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
