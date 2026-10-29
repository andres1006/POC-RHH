import Link from 'next/link'
import { Heart } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listFavorites } from '@/server/services/culture'
import { toggleFavorite } from '@/server/actions'
import { Card, Empty, PageHeader, cx } from '@/platform/ui'
import { BENEFITS, BENEFIT_CATEGORIES } from '@/modules/culture/values'

export default async function Beneficios({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ cat?: string; fav?: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const { cat, fav } = await searchParams
  const favorites = await listFavorites(ctx)
  const isFav = (id: string) => favorites.has(id)
  const shown = BENEFITS.filter((b) => (!cat || b.category === cat) && (!fav || isFav(b.id)))
  const chip = (active: boolean) => cx('rounded-full px-3.5 py-1.5 text-[13px] font-medium transition', active ? 'bg-primary text-white' : 'bg-surface hover:bg-fill')

  return (
    <div>
      <PageHeader title="Beneficios" subtitle={`Convenios y descuentos que ${ctx.tenant.name} tiene para ti`} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="?" className={chip(!cat && !fav)}>Todos <span className="opacity-60">{BENEFITS.length}</span></Link>
        {BENEFIT_CATEGORIES.map((c) => (
          <Link key={c} href={`?cat=${encodeURIComponent(c)}`} className={chip(cat === c)}>{c} <span className="opacity-60">{BENEFITS.filter((b) => b.category === c).length}</span></Link>
        ))}
        <Link href="?fav=1" className={chip(!!fav)}>♥ Favoritos</Link>
      </div>
      {shown.length === 0 ? <Card><Empty title="Aún no tienes favoritos" text="Toca el corazón de un beneficio para guardarlo" /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => (
            <article key={b.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <div className="relative flex h-32 items-end p-4" style={{ background: `linear-gradient(135deg, hsl(${b.hue} 70% 88%), hsl(${b.hue + 40} 70% 78%))` }}>
                <span className="rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{b.discount}</span>
                <form action={toggleFavorite} className="absolute right-3 top-3">
                  <input type="hidden" name="tenant" value={slug} />
                  <input type="hidden" name="benefit" value={b.id} />
                  <button aria-label={isFav(b.id) ? `Quitar ${b.name} de favoritos` : `Guardar ${b.name} en favoritos`} aria-pressed={isFav(b.id)} className="rounded-full bg-white/80 p-2 backdrop-blur transition active:scale-90">
                    <Heart className={cx('size-4', isFav(b.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-700')} />
                  </button>
                </form>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-primary">{b.category}</p>
                <h2 className="mt-0.5 font-semibold">{b.name}</h2>
                <p className="mt-1 text-sm text-muted">{b.text}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
