import Link from 'next/link'
import { Search } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listAreas, listEmployees } from '@/server/services/people'
import { fullName } from '@/platform/format'
import { Avatar, Card, Empty, PageHeader, cx } from '@/platform/ui'

export default async function Directorio({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ q?: string; area?: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const { q = '', area } = await searchParams
  const [shown, areas, all] = await Promise.all([listEmployees(ctx, { q, area }), listAreas(ctx), listEmployees(ctx)])

  return (
    <div>
      <PageHeader title="Directorio" subtitle={`${all.length} personas en ${ctx.tenant.name}`} />
      <form className="mb-4" role="search">
        <label className="flex items-center gap-2 rounded-[10px] bg-fill px-3 py-2 text-[15px]">
          <Search className="size-4 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Buscar por nombre o cargo" className="w-full bg-transparent outline-none" aria-label="Buscar por nombre o cargo" />
        </label>
        {area && <input type="hidden" name="area" value={area} />}
      </form>
      <div className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...areas].map((a) => (
          <Link key={a ?? 'all'} href={`?${new URLSearchParams({ ...(q && { q }), ...(a && { area: a }) })}`} aria-current={a === area ? 'true' : undefined}
            className={cx('rounded-full px-3.5 py-1.5 text-[13px] font-medium transition', a === area ? 'bg-primary text-white' : 'bg-surface text-fg hover:bg-fill')}>
            {a ?? 'Todas'}
          </Link>
        ))}
      </div>
      {shown.length === 0 ? <Card><Empty title="Sin resultados" text="Prueba con otro nombre o área" /></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <Link key={e.id} href={`/${slug}/perfil/${e.id}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:shadow-sm">
              <Avatar name={fullName(e)} size={44} />
              <div className="min-w-0">
                <p className="truncate font-medium">{fullName(e)}</p>
                <p className="truncate text-sm text-muted">{e.position}</p>
                <p className="truncate text-xs text-muted">{e.department} · {e.email}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
