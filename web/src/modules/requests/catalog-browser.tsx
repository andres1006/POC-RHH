'use client'
import { startTransition, useActionState, useMemo, useState } from 'react'
import { Armchair, Globe, LayoutGrid, List, Search, Smartphone, UserRoundCog, Wallet, Landmark } from 'lucide-react'
import { requestService, type ActionState } from '@/server/actions'
import { SERVICE_CATEGORIES, SERVICES, type ServiceItem } from './catalog'
import { cx } from '@/platform/ui'

const ICONS: Record<string, typeof Globe> = {
  jefe: UserRoundCog,
  silla: Armchair,
  'beneficio-celular': Globe,
  'plan-celular': Smartphone,
  'prima-cesantias': Wallet,
  'eps-pension': Landmark,
}

function Art({ s }: { s: ServiceItem }) {
  const Icon = ICONS[s.id] ?? Globe
  if (s.variant === 'navy') {
    return (
      <div className="flex h-[108px] items-center justify-end bg-[#163E73] px-6">
        <Icon className="size-14 text-white" strokeWidth={1.4} aria-hidden />
      </div>
    )
  }
  if (s.variant === 'muted') {
    return (
      <div className="flex h-[108px] items-center justify-center bg-[#E8EEF4]">
        <Icon className="size-12 text-primary/70" strokeWidth={1.4} aria-hidden />
      </div>
    )
  }
  return (
    <div className="relative flex h-[108px] items-end justify-between overflow-hidden px-5 pb-3" style={{ background: s.tint }}>
      <span className="absolute -right-6 -top-8 size-28 rounded-full bg-white/40" aria-hidden />
      <span className="absolute right-10 top-2 size-16 rounded-full bg-white/50" aria-hidden />
      <p className="relative z-[1] max-w-[70%] text-[22px] font-bold leading-tight text-primary">{s.title}</p>
      <Icon className="relative z-[1] size-10 shrink-0 text-primary/80" strokeWidth={1.5} aria-hidden />
    </div>
  )
}

export function CatalogBrowser({ tenant }: { tenant: string }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<(typeof SERVICE_CATEGORIES)[number]>('Todas')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [state, run, pending] = useActionState(requestService, {} as ActionState)

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()
    return SERVICES.filter((s) => (cat === 'Todas' || s.category === cat)
      && (!query || `${s.title} ${s.subtitle} ${s.description}`.toLowerCase().includes(query)))
  }, [q, cat])

  const start = (service: string, option?: string) => {
    const data = new FormData()
    data.set('tenant', tenant)
    data.set('service', service)
    if (option) data.set('option', option)
    startTransition(() => run(data))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:pt-1">
        <p className="mb-2 text-[13px] font-semibold text-muted">Categorías</p>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Categorías de servicios">
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cx(
                'whitespace-nowrap rounded-full px-3.5 py-2 text-left text-[13px] font-medium transition lg:rounded-[10px]',
                cat === c ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-fill hover:text-fg',
              )}
            >
              {c}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold">Servicios</h2>
            <p className="mt-1 text-sm text-muted">Selecciona el servicio que quieres comenzar. Puedes buscarlo por nombre o filtrar por una de las categorías disponibles.</p>
          </div>
          <div className="flex rounded-[9px] bg-fill p-0.5" role="group" aria-label="Vista">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={cx('rounded-[7px] p-1.5', view === 'grid' ? 'bg-surface shadow-sm' : 'text-muted')} aria-label="Vista de tarjetas"><LayoutGrid className="size-4" /></button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={cx('rounded-[7px] p-1.5', view === 'list' ? 'bg-surface shadow-sm' : 'text-muted')} aria-label="Vista de lista"><List className="size-4" /></button>
          </div>
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-muted">
          <Search className="size-4" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio" className="w-full bg-transparent text-fg outline-none" aria-label="Buscar servicio" />
        </label>
        {state.error && <p role="alert" className="mb-3 text-sm text-rose-600">{state.error}</p>}
        {state.ok && <p role="status" className="mb-3 text-sm text-emerald-600">✓ Solicitud enviada</p>}
        <p className="mb-3 text-sm font-medium">{cat}</p>
        {shown.length === 0 ? <p className="py-10 text-center text-sm text-muted">No hay servicios con ese filtro</p> : view === 'grid' ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((s) => (
              <li key={s.id}>
                <ServiceCard s={s} pending={pending} onStart={start} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {shown.map((s) => {
              const Icon = ICONS[s.id] ?? Globe
              return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className={cx('flex size-10 shrink-0 items-center justify-center rounded-lg', s.variant === 'navy' ? 'bg-[#163E73] text-white' : 'bg-primary/10 text-primary')}>
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">{s.subtitle}</p>
                </div>
                {s.options ? s.options.map((o) => (
                  <button key={o.id} type="button" disabled={pending} onClick={() => start(s.id, o.id)} className="rounded-full bg-fill px-3 py-1.5 text-xs font-medium hover:bg-primary/10">{o.title}</button>
                )) : (
                  <button type="button" disabled={pending} onClick={() => start(s.id)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white">Comenzar</button>
                )}
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ s, pending, onStart }: { s: ServiceItem; pending: boolean; onStart: (id: string, option?: string) => void }) {
  const navy = s.variant === 'navy'
  return (
    <article className={cx('flex h-full flex-col overflow-hidden rounded-[18px] border border-line shadow-[0_1px_2px_rgb(0_0_0/0.04)]', navy ? 'bg-[#163E73] text-white' : 'bg-surface')}>
      <Art s={s} />
      <div className="flex flex-1 flex-col p-4">
        <h3 className={cx('font-semibold', navy && 'text-white')}>{s.variant === 'light' ? s.subtitle : s.title}</h3>
        <p className={cx('mt-1 text-sm', navy ? 'text-white/75' : 'text-muted')}>{s.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {s.options ? s.options.map((o) => (
            <button key={o.id} type="button" disabled={pending} onClick={() => onStart(s.id, o.id)} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50">{o.title}</button>
          )) : (
            <button type="button" disabled={pending} onClick={() => onStart(s.id)} className={cx('rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50', navy ? 'bg-white text-[#163E73] hover:bg-white/90' : 'bg-primary text-white hover:brightness-110')}>Comenzar</button>
          )}
        </div>
      </div>
    </article>
  )
}
