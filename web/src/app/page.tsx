import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listTenants } from '@/server/auth/service'
import { tenantBrand } from '@/platform/brand'
import { btn } from '@/platform/ui'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const tenants = await listTenants()
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-12">
      <p className="text-sm font-semibold text-primary">Nexo RH</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight">Elige tu empresa</h1>
      <p className="mt-2 text-muted">Cada empresa es un espacio aislado con su propia marca, personas y procesos.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tenants.map((t) => {
          const brand = tenantBrand(t.slug)
          return (
          <Link key={t.slug} href={`/${t.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 transition hover:shadow-md focus-visible:outline-2" style={{ '--primary': t.primaryColor } as React.CSSProperties}>
            {brand ? (
              <>
                <img src={brand.logo} alt="" className="h-8 w-auto dark:hidden" />
                <img src={brand.logoOnDark} alt="" className="hidden h-8 w-auto dark:block" />
              </>
            ) : (
              <span className="flex size-10 items-center justify-center rounded-[11px] bg-primary text-lg font-bold text-white" aria-hidden>{t.name[0]}</span>
            )}
            <p className="mt-4 font-semibold">{t.name}</p>
            {t.tagline && <p className="text-sm text-muted">{t.tagline}</p>}
            <p className="mt-3 text-xs text-muted">{t.slug}.nexorh.co</p>
          </Link>
          )
        })}
        <Link href="/registro" className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line p-5 text-muted transition hover:border-primary hover:text-primary">
          <Plus className="size-6" aria-hidden />
          <span className="font-medium">Registrar nueva empresa</span>
        </Link>
      </div>
      <p className="mt-8 text-xs text-muted">¿Integras otro sistema? La API REST está en <code>/api/v1/&#123;empresa&#125;/…</code> (ver README).</p>
      <Link href="/registro" className={`${btn.primary} mt-6 self-start sm:hidden`}>Registrar empresa</Link>
    </main>
  )
}
