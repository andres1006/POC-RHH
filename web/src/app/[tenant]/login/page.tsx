import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { findTenant } from '@/server/auth/service'
import { getCtx } from '@/server/session'
import { withTenant } from '@/server/db/client'
import { employees, users } from '@/server/db/schema'
import { tenantBrand } from '@/platform/brand'
import { LoginForm } from './login-form'

export default async function Login({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await findTenant(slug)
  if (!tenant) notFound()
  if (await getCtx(slug)) redirect(`/${slug}`)
  // Solo en empresas demo se listan las cuentas de prueba para entrar con un clic.
  const demo = tenant.isDemo
    ? await withTenant(tenant.id, (tx) => tx.select({ email: users.email, role: employees.role, name: employees.firstName }).from(users).innerJoin(employees, eq(employees.id, users.employeeId)))
    : []
  const brand = tenantBrand(slug)

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12" style={{ '--primary': tenant.primaryColor } as React.CSSProperties}>
      <div className="w-full max-w-sm">
        {brand ? (
          <>
            <img src={brand.logo} alt={tenant.name} className="h-10 w-auto dark:hidden" />
            <img src={brand.logoOnDark} alt="" className="hidden h-10 w-auto dark:block" />
          </>
        ) : (
          <span className="flex size-12 items-center justify-center rounded-[13px] bg-primary text-xl font-bold text-white" aria-hidden>{tenant.name[0]}</span>
        )}
        <h1 className="mt-5 text-[28px] font-bold leading-tight">Te damos la bienvenida</h1>
        <p className="mt-1 text-muted">Ingresa a {tenant.name}</p>
        <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <LoginForm tenant={slug} demo={demo} />
        </section>
        <Link href="/" className="mt-6 inline-block text-sm text-primary">← Cambiar de empresa</Link>
      </div>
    </main>
  )
}
