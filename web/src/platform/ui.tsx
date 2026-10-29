import type { ReactNode } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

export const cx = clsx

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-[var(--radius-card)] border border-line bg-surface p-5', className)}>{children}</section>
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-[17px] font-semibold">{children}</h2>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[32px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

const TONES = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  primary: 'bg-primary/10 text-primary',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>
}

export const STATUS: Record<string, { label: string; tone: keyof typeof TONES }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
}

/** Paleta corta alrededor del color de marca: sin pasteles rosa/verde/naranja. */
const AVATAR_TONES = [
  { bg: 'color-mix(in srgb, var(--primary) 18%, white)', fg: 'var(--primary)' },
  { bg: 'var(--primary)', fg: '#fff' },
  { bg: 'color-mix(in srgb, var(--primary) 78%, #0b1f3a)', fg: '#fff' },
  { bg: 'color-mix(in srgb, var(--primary) 12%, #e8eef4)', fg: '#1e3a5f' },
  { bg: '#e2e8f0', fg: '#334155' },
  { bg: 'color-mix(in srgb, var(--primary) 32%, #dbeafe)', fg: '#163e73' },
]

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight"
      style={{ width: size, height: size, fontSize: size * 0.38, background: tone.bg, color: tone.fg }}
    >
      {initials}
    </span>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tabular-nums leading-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <div className="mb-2 size-12 rounded-full bg-primary/10" />
      <p className="text-sm font-medium">{title}</p>
      {text && <p className="text-xs text-muted">{text}</p>}
    </div>
  )
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-[15px] font-medium text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-full bg-fill px-4 py-2 text-[15px] font-medium text-primary transition hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary',
  tinted: 'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/12 px-3.5 py-1.5 text-[13px] font-semibold text-primary transition hover:bg-primary/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary',
}

export const field = 'w-full min-w-0 rounded-[10px] border border-transparent bg-fill px-3 py-2 text-[15px] outline-none transition focus:border-primary focus:bg-surface'

/** Control segmentado estilo iOS para pestañas basadas en URL. */
export function Segmented({ items, active }: { items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <div role="tablist" className="inline-flex rounded-[9px] bg-fill p-0.5">
      {items.map((i) => (
        <Link key={i.key} href={i.href} scroll={false} role="tab" aria-selected={i.key === active}
          className={cx('rounded-[7px] px-3.5 py-1 text-[13px] font-medium transition', i.key === active ? 'bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-fg')}>
          {i.label}
        </Link>
      ))}
    </div>
  )
}

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
