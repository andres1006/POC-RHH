'use client'
import { useOptimistic, useTransition } from 'react'
import { moveInBox } from '@/server/actions'
import { Avatar, cx } from '@/platform/ui'

type Person = { id: string; name: string; position: string; performance: 1 | 2 | 3; potential: 1 | 2 | 3 }

const LABELS: Record<string, string> = {
  '3-3': 'Estrella', '2-3': 'Alto potencial', '1-3': 'Enigma',
  '3-2': 'Alto desempeño', '2-2': 'Pilar', '1-2': 'Dilema',
  '3-1': 'Profesional sólido', '2-1': 'Efectivo', '1-1': 'En riesgo',
}
const TONE: Record<string, string> = { '3-3': 'bg-emerald-500/12', '2-3': 'bg-emerald-500/8', '3-2': 'bg-emerald-500/8', '1-1': 'bg-rose-500/10' }

export function NineBox({ tenant, people, editable }: { tenant: string; people: Person[]; editable: boolean }) {
  const [, start] = useTransition()
  const [optimistic, move] = useOptimistic(people, (state, m: { id: string; performance: 1 | 2 | 3; potential: 1 | 2 | 3 }) =>
    state.map((p) => (p.id === m.id ? { ...p, ...m } : p)))

  const send = (id: string, performance: 1 | 2 | 3, potential: 1 | 2 | 3) => start(async () => {
    move({ id, performance, potential })
    const f = new FormData()
    Object.entries({ tenant, employee: id, performance: String(performance), potential: String(potential) }).forEach(([k, v]) => f.set(k, v))
    await moveInBox(f)
  })

  return (
    <div className="grid grid-cols-[24px_1fr] gap-2">
      <div className="flex items-center justify-center"><span className="-rotate-90 whitespace-nowrap text-xs font-medium text-muted">Potencial →</span></div>
      <div>
        <div className="grid grid-cols-3 gap-2">
          {([3, 2, 1] as const).flatMap((pot) => ([1, 2, 3] as const).map((perf) => {
            const key = `${perf}-${pot}`
            const here = optimistic.filter((p) => p.performance === perf && p.potential === pot)
            return (
              <div
                key={key}
                onDragOver={(e) => editable && e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); if (id) send(id, perf, pot) }}
                className={cx('min-h-32 rounded-2xl border border-line p-2.5', TONE[key] ?? 'bg-surface')}
              >
                <p className="mb-2 flex justify-between text-xs font-semibold">{LABELS[key]} <span className="text-muted">{here.length}</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {here.map((p) => (
                    <div
                      key={p.id}
                      draggable={editable}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                      className={cx('group relative rounded-full bg-surface p-0.5 shadow-sm', editable && 'cursor-grab active:cursor-grabbing')}
                      title={`${p.name} · ${p.position}`}
                    >
                      <Avatar name={p.name} size={30} />
                      {editable && (
                        <select
                          aria-label={`Mover a ${p.name}`}
                          value={key}
                          onChange={(e) => { const [a, b] = e.target.value.split('-').map(Number); send(p.id, a as 1 | 2 | 3, b as 1 | 2 | 3) }}
                          // Alternativa de teclado al arrastrar: invisible hasta recibir foco
                          className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-full focus:z-10 focus:mt-1 focus:rounded-md focus:border focus:border-line focus:bg-surface focus:text-xs"
                        >
                          {Object.entries(LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          }))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-muted">Desempeño →</p>
      </div>
    </div>
  )
}
