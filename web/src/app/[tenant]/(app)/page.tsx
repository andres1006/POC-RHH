import Link from 'next/link'
import { Award, CalendarCheck, FileSignature, FileText, Gift, Heart, Palmtree, Trash2 } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listFeed } from '@/server/services/culture'
import { listEmployees } from '@/server/services/people'
import { getBalance, listRequests } from '@/server/services/requests'
import { listMyDocuments } from '@/server/services/documents'
import { deletePost, publishNews, toggleLike } from '@/server/actions'
import { can } from '@/platform/rbac'
import { fullName } from '@/platform/format'
import { ActionForm } from '@/platform/action-form'
import { Avatar, Badge, Card, CardTitle, Empty, btn, cx, field, fmtDate } from '@/platform/ui'

const greeting = () => {
  const h = new Date(Date.now() - 5 * 3_600_000).getUTCHours()
  return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default async function Portal({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const [feed, people, balance, toApprove, docs] = await Promise.all([listFeed(ctx), listEmployees(ctx), getBalance(ctx), listRequests(ctx, 'to_approve'), listMyDocuments(ctx)])
  const byId = new Map(people.map((e) => [e.id, e]))
  const toSign = docs.filter((d) => d.status === 'pending_signature').length
  const month = new Date().getMonth() + 1
  const birthdays = people.filter((e) => e.birthDate && Number(e.birthDate.slice(5, 7)) === month).sort((a, b) => a.birthDate!.slice(8).localeCompare(b.birthDate!.slice(8))).slice(0, 6)
  const base = `/${slug}`

  return (
    <div>
      <p className="text-sm text-muted">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 className="mb-6 text-[32px] font-bold leading-tight">¡{greeting()}, {ctx.user.firstName}!</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {toApprove.length > 0 && (
            <Link href={`${base}/solicitudes`} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <CalendarCheck className="size-5" aria-hidden />
              <span className="flex-1 text-sm">Tienes <b>{toApprove.length}</b> solicitud{toApprove.length > 1 ? 'es' : ''} por aprobar</span>
              <span className="text-sm font-medium">Revisar →</span>
            </Link>
          )}

          {can(ctx.user.role, 'feed.publish') && (
            <Card>
              <ActionForm action={publishNews} tenant={slug} submit="Publicar" success="Publicado en el feed">
                <label className="block">
                  <span className="sr-only">Nueva publicación</span>
                  <textarea name="body" rows={2} required minLength={10} maxLength={1000} placeholder="Comparte una noticia con toda la empresa…" className={field} />
                </label>
              </ActionForm>
            </Card>
          )}

          {feed.length === 0 && <Card><Empty title="Aún no hay publicaciones" text="Pronto verás anuncios, reconocimientos y noticias de tu empresa" /></Card>}
          {feed.map(({ post: p, likes, liked }) => {
            const author = byId.get(p.authorId)
            const to = p.toId ? byId.get(p.toId) : undefined
            if (!author) return null
            const canDelete = p.authorId === ctx.user.employeeId || can(ctx.user.role, 'feed.publish')
            return (
              <Card key={p.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(author)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fullName(author)}</p>
                    <p className="truncate text-xs text-muted">{author.position} · {fmtDate(p.date)}</p>
                  </div>
                  {p.kind === 'recognition' && <Badge tone="primary">Reconocimiento</Badge>}
                </div>
                {to && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                    <Award className="size-8 shrink-0 text-primary" aria-hidden />
                    <div className="text-sm">
                      <p>Reconoció a <b>{fullName(to)}</b></p>
                      <p className="text-xs text-muted">Valor: {p.value}</p>
                    </div>
                  </div>
                )}
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{p.body}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <form action={toggleLike}>
                    <input type="hidden" name="tenant" value={slug} />
                    <input type="hidden" name="post" value={p.id} />
                    <button aria-pressed={liked} className={cx('flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition active:scale-95', liked ? 'text-rose-500' : 'text-muted hover:bg-fill')}>
                      <Heart className={cx('size-4', liked && 'fill-current')} aria-hidden /> {likes} · Me gusta
                    </button>
                  </form>
                  {canDelete && (
                    <form action={deletePost}>
                      <input type="hidden" name="tenant" value={slug} />
                      <input type="hidden" name="post" value={p.id} />
                      <button className="rounded-full p-1.5 text-muted hover:bg-fill hover:text-rose-600" aria-label="Eliminar publicación"><Trash2 className="size-4" /></button>
                    </form>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardTitle>Accesos directos</CardTitle>
            <div className="rounded-xl bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm text-muted"><Palmtree className="size-4 text-primary" aria-hidden /> Vacaciones disponibles</div>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{balance.available.toLocaleString('es-CO')} <span className="text-base font-normal text-muted">días</span></p>
              <Link href={`${base}/vacaciones`} className={`${btn.primary} mt-3 w-full`}>Solicitar vacaciones</Link>
            </div>
            <ul className="mt-3 divide-y divide-line text-sm">
              {[
                { href: '/vacaciones#permiso', label: 'Solicitar permiso', icon: CalendarCheck },
                { href: '/documentos?tab=pendientes', label: toSign ? `Firmar documentos (${toSign})` : 'Mis documentos', icon: FileSignature },
                { href: '/documentos', label: 'Generar certificado', icon: FileText },
                { href: '/beneficios', label: 'Mis beneficios', icon: Gift },
              ].map((a) => (
                <li key={a.label}>
                  <Link href={base + a.href} className="flex items-center gap-3 py-3 hover:text-primary"><a.icon className="size-4 text-muted" aria-hidden /> {a.label}</Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>🎂 Cumpleaños del mes</CardTitle>
            {birthdays.length === 0 ? <p className="text-sm text-muted">No hay cumpleaños este mes.</p> : (
              <ul className="space-y-3">
                {birthdays.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <Avatar name={fullName(e)} size={32} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{fullName(e)}</p>
                      <p className="truncate text-xs text-muted">{e.department}</p>
                    </div>
                    <span className="text-xs text-muted">{Number(e.birthDate!.slice(8))} {new Date(2026, month - 1).toLocaleDateString('es-CO', { month: 'short' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
