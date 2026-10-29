import { Award } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listFeed } from '@/server/services/culture'
import { listEmployees } from '@/server/services/people'
import { giveRecognition } from '@/server/actions'
import { fullName } from '@/platform/format'
import { ActionForm, Field } from '@/platform/action-form'
import { Avatar, Badge, Card, CardTitle, Empty, PageHeader, field, fmtDate } from '@/platform/ui'
import { VALUES } from '@/modules/culture/values'

export default async function Reconocimientos({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const [recs, people] = await Promise.all([listFeed(ctx, 'recognition'), listEmployees(ctx)])
  const byId = new Map(people.map((e) => [e.id, e]))
  const ranking = [...recs.reduce((m, { post }) => m.set(post.toId!, (m.get(post.toId!) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader title="Reconocimientos" subtitle="Celebra a quienes viven los valores de la empresa" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {recs.length === 0 && <Card><Empty title="Aún no hay reconocimientos" text="Sé la primera persona en reconocer a alguien" /></Card>}
          {recs.map(({ post: r }) => {
            const from = byId.get(r.authorId), to = byId.get(r.toId!)
            if (!from || !to) return null
            return (
              <Card key={r.id}>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12"><Award className="size-6 text-primary" aria-hidden /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><b>{fullName(from)}</b> reconoció a <b>{fullName(to)}</b></p>
                    <div className="mt-1 flex items-center gap-2"><Badge tone="primary">{r.value}</Badge><span className="text-xs text-muted">{fmtDate(r.date)}</span></div>
                    <p className="mt-3 text-[15px] leading-relaxed">“{r.body}”</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        <aside className="space-y-6">
          <Card>
            <CardTitle>Dar un reconocimiento</CardTitle>
            <ActionForm action={giveRecognition} tenant={slug} submit="Publicar reconocimiento" success="¡Publicado en el feed!">
              <Field label="¿A quién?">
                <select name="to" required className={field} defaultValue="">
                  <option value="" disabled>Elige un compañero</option>
                  {people.filter((p) => p.id !== ctx.user.employeeId).map((p) => <option key={p.id} value={p.id}>{fullName(p)} · {p.department}</option>)}
                </select>
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium">Valor</legend>
                <div className="flex flex-wrap gap-2">
                  {VALUES.map((v, i) => (
                    <label key={v} className="cursor-pointer">
                      <input type="radio" name="value" value={v} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="block rounded-full bg-fill px-3 py-1.5 text-[13px] font-medium peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-primary">{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Mensaje"><textarea name="message" rows={3} required minLength={10} maxLength={400} className={field} placeholder="Cuéntale al equipo qué hizo…" /></Field>
            </ActionForm>
          </Card>
          {ranking.length > 0 && (
            <Card>
              <CardTitle>🏆 Más reconocidos</CardTitle>
              <ol className="space-y-3">
                {ranking.map(([id, n], i) => byId.get(id) && (
                  <li key={id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-muted">{i + 1}</span>
                    <Avatar name={fullName(byId.get(id)!)} size={30} />
                    <span className="flex-1 truncate">{fullName(byId.get(id)!)}</span>
                    <b className="tabular-nums">{n}</b>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
