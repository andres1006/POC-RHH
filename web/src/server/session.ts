import 'server-only'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { findTenant, resolveSession } from './auth/service'
import type { Ctx } from './context'

// Cookie por empresa: se puede tener sesión en varias empresas a la vez.
export const sessionCookie = (slug: string) => `rh_session_${slug}`

/** Contexto de la petición actual (cacheado por render). null si no hay sesión válida. */
export const getCtx = cache(async (slug: string): Promise<Ctx | null> => {
  const tenant = await findTenant(slug)
  if (!tenant) notFound()
  const user = await resolveSession(tenant, (await cookies()).get(sessionCookie(slug))?.value)
  return user ? { tenant, user } : null
})

/** Para páginas y Server Actions: exige sesión o redirige al login de la empresa. */
export async function requireCtx(slug: string): Promise<Ctx> {
  const ctx = await getCtx(slug)
  if (!ctx) redirect(`/${slug}/login`)
  return ctx
}
