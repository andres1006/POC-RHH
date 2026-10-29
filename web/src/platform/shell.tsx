'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  AlarmClock, Award, ChartColumn, ChevronsLeft, ChevronsRight, Circle, Eye, EyeOff, FileSignature, Gift, Grid3x3, Home, KeyRound,
  ListChecks, LogOut, Menu, Network, Palmtree, Search, Settings, UserRound, Users, Workflow, X, type LucideIcon,
} from 'lucide-react'
import type { NavItem, Role } from './rbac'
import { ROLE_LABEL } from './rbac'
import { Avatar, cx } from './ui'
import { logoutAction } from '@/server/actions'

type Props = {
  tenant: { slug: string; name: string; logo?: string; logoOnDark?: string }
  user: { name: string; position: string; role: Role }
  nav: NavItem[]
  collapsed: boolean
  children: ReactNode
}

const ICONS: Record<string, LucideIcon> = { AlarmClock, Award, ChartColumn, FileSignature, Gift, Grid3x3, Home, ListChecks, Network, Palmtree, Settings, UserRound, Users, Workflow }
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const C = ICONS[name] ?? Circle
  return <C className={className} aria-hidden />
}

function SensitiveToggle() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => { try { setHidden(localStorage.getItem('rh-hide') === '1') } catch {} }, [])
  useEffect(() => {
    document.documentElement.toggleAttribute('data-hide-sensitive', hidden)
    try { localStorage.setItem('rh-hide', hidden ? '1' : '0') } catch {}
  }, [hidden])
  return (
    <button onClick={() => setHidden(!hidden)} className="rounded-full p-2 text-muted hover:bg-fill" aria-pressed={hidden} aria-label={hidden ? 'Mostrar datos sensibles' : 'Ocultar datos sensibles'} title="Datos sensibles">
      {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}

/** Lista de navegación agrupada; en modo compacto solo íconos con tooltip. */
function NavList({ nav, base, active, compact, onNavigate }: { nav: NavItem[]; base: string; active: (h: string) => boolean; compact?: boolean; onNavigate?: () => void }) {
  const groups = [...new Set(nav.map((n) => n.group))]
  return (
    <>
      {groups.map((g) => (
        <div key={g} className={compact ? 'mt-2 border-t border-line pt-2 first:mt-0 first:border-0 first:pt-0' : 'mt-4 first:mt-1'}>
          {!compact && <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</p>}
          {nav.filter((n) => n.group === g).map((n) => (
            <Link
              key={n.href}
              href={base + n.href}
              onClick={onNavigate}
              aria-current={active(n.href) ? 'page' : undefined}
              aria-label={compact ? n.label : undefined}
              title={compact ? n.label : undefined}
              className={cx(
                'flex items-center rounded-[8px] text-[14px] transition',
                compact ? 'mx-auto size-10 justify-center' : 'gap-3 px-2 py-1.5',
                active(n.href) ? 'bg-primary text-white' : 'hover:bg-fill',
              )}
            >
              <Icon name={n.icon} className={cx('size-[18px] shrink-0', !active(n.href) && 'text-primary')} />
              {!compact && <span className="truncate">{n.label}</span>}
            </Link>
          ))}
        </div>
      ))}
    </>
  )
}

function BrandMark({ tenant, compact }: { tenant: { name: string; logo?: string; logoOnDark?: string }; compact?: boolean }) {
  if (tenant.logo) {
    const box = compact ? 'h-8 w-8 object-contain object-left' : 'h-8 w-auto max-w-[152px]'
    return (
      <>
        <img src={tenant.logo} alt={tenant.name} className={cx(box, 'dark:hidden')} />
        <img src={tenant.logoOnDark ?? tenant.logo} alt="" className={cx(box, 'hidden dark:block')} />
      </>
    )
  }
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-primary text-sm font-bold text-white" aria-hidden>{tenant.name[0]}</span>
      {!compact && <span className="truncate font-semibold">{tenant.name}</span>}
    </>
  )
}

function LogoutButton({ slug, className }: { slug: string; className?: string }) {
  return (
    <form action={logoutAction}>
      <input type="hidden" name="tenant" value={slug} />
      <button className={className}><LogOut className="size-4" aria-hidden /> Cerrar sesión</button>
    </form>
  )
}

export function Shell({ tenant, user, nav, collapsed: initialCollapsed, children }: Props) {
  const path = usePathname()
  const base = `/${tenant.slug}`
  const active = (href: string) => (href === '' ? path === base : path.startsWith(base + href))
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [drawer, setDrawer] = useState(false)

  const toggle = () => {
    setCollapsed(!collapsed)
    document.cookie = `rh_sidebar=${collapsed ? 'open' : 'collapsed'}; path=/; max-age=31536000; samesite=lax`
  }

  // Cierra el menú móvil al navegar y con Escape; bloquea el scroll del fondo mientras está abierto
  useEffect(() => setDrawer(false), [path])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [drawer])

  const tabs = nav.filter((n) => ['', '/vacaciones', '/solicitudes', '/perfil'].includes(n.href))

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar escritorio */}
      <aside className={cx('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-chrome backdrop-blur-xl backdrop-saturate-150 transition-[width] duration-200 lg:flex', collapsed ? 'w-[68px]' : 'w-64')}>
        <div className={cx('flex items-center py-4', collapsed ? 'justify-center' : 'gap-2 px-5')}>
          <BrandMark tenant={tenant} compact={collapsed} />
        </div>
        <nav className={cx('flex-1 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-3')} aria-label="Principal">
          <NavList nav={nav} base={base} active={active} compact={collapsed} />
        </nav>
        <button onClick={toggle} className={cx('m-3 flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-muted hover:bg-fill', collapsed && 'justify-center')} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-expanded={!collapsed} title={collapsed ? 'Expandir menú' : undefined}>
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Contraer</>}
        </button>
      </aside>

      {/* Menú móvil (drawer) */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" aria-label="Cerrar menú" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-surface shadow-2xl">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <BrandMark tenant={tenant} />
              <button onClick={() => setDrawer(false)} className="ml-auto rounded-full p-2 hover:bg-fill" aria-label="Cerrar menú"><X className="size-5" /></button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar name={user.name} size={40} />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.position} · {ROLE_LABEL[user.role]}</p>
              </div>
            </div>
            <form action={`${base}/directorio`} className="px-4 pb-2" role="search">
              <label className="flex items-center gap-2 rounded-[10px] bg-fill px-3 py-2 text-sm text-muted">
                <Search className="size-4" aria-hidden />
                <input name="q" placeholder="Buscar personas…" className="w-full bg-transparent text-fg outline-none" aria-label="Buscar personas" />
              </label>
            </form>
            <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Principal móvil">
              <NavList nav={nav} base={base} active={active} onNavigate={() => setDrawer(false)} />
            </nav>
            <div className="space-y-1 border-t border-line p-3">
              <Link href={`${base}/cuenta`} className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm hover:bg-fill"><KeyRound className="size-4" aria-hidden /> Cambiar contraseña</Link>
              <LogoutButton slug={tenant.slug} className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-rose-600 hover:bg-fill" />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-chrome px-3 py-2 backdrop-blur-xl backdrop-saturate-150 lg:px-4">
          <button onClick={() => setDrawer(true)} className="rounded-full p-2 hover:bg-fill lg:hidden" aria-label="Abrir menú" aria-expanded={drawer}><Menu className="size-5" /></button>
          {tenant.logo ? (
            <>
              <img src={tenant.logo} alt={tenant.name} className="h-7 w-auto lg:hidden dark:hidden" />
              <img src={tenant.logoOnDark ?? tenant.logo} alt="" className="hidden h-7 w-auto dark:block lg:hidden" />
            </>
          ) : <span className="truncate font-semibold lg:hidden">{tenant.name}</span>}
          <form action={`${base}/directorio`} className="hidden flex-1 sm:flex md:max-w-sm" role="search">
            <label className="flex w-full items-center gap-2 rounded-[10px] bg-fill px-3 py-1.5 text-sm text-muted">
              <Search className="size-4" aria-hidden />
              <input name="q" placeholder="Buscar personas…" className="w-full bg-transparent text-fg outline-none" aria-label="Buscar personas" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1">
            <SensitiveToggle />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 hover:bg-fill [&::-webkit-details-marker]:hidden" aria-label="Menú de usuario">
                <Avatar name={user.name} size={32} />
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
                </span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                <Link href={`${base}/perfil`} className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm hover:bg-fill"><UserRound className="size-4" aria-hidden /> Mi ficha</Link>
                <Link href={`${base}/cuenta`} className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm hover:bg-fill"><KeyRound className="size-4" aria-hidden /> Cambiar contraseña</Link>
                <LogoutButton slug={tenant.slug} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-rose-600 hover:bg-fill" />
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>

        {/* Barra inferior móvil: accesos frecuentes + "Más" abre el menú completo */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-chrome pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden" aria-label="Accesos rápidos">
          {tabs.map((n) => (
            <Link key={n.href} href={base + n.href} aria-current={active(n.href) ? 'page' : undefined} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', active(n.href) ? 'text-primary' : 'text-muted')}>
              <Icon name={n.icon} className="size-5" />
              {n.label.split(' ')[0]}
            </Link>
          ))}
          <button onClick={() => setDrawer(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted" aria-label="Más opciones">
            <Menu className="size-5" aria-hidden />
            Más
          </button>
        </nav>
      </div>
    </div>
  )
}
