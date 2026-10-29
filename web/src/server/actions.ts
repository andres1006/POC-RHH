'use server'
// Server Actions de la web: cada una solo arma el contexto y llama al mismo servicio que usa la API REST.
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'
import { AppError, type Ctx } from './context'
import { getCtx, sessionCookie } from './session'
import { changePassword, findTenant, login, logout, registerTenant } from './auth/service'
import * as req from './services/requests'
import * as docs from './services/documents'
import * as onb from './services/onboarding'
import * as ops from './services/operations'
import * as culture from './services/culture'
import * as admin from './services/admin'

export type ActionState = { ok?: boolean; error?: string; data?: Record<string, string> }

const fields = (form: FormData) => Object.fromEntries(form)

function toError(e: unknown): ActionState {
  if (e instanceof AppError) return { error: e.message }
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? 'Datos inválidos' }
  throw e
}

/** Ejecuta un servicio con la sesión de la empresa del formulario y refresca la UI. */
async function run(form: FormData, fn: (ctx: Ctx) => Promise<unknown>): Promise<ActionState> {
  const slug = String(form.get('tenant'))
  const ctx = await getCtx(slug)
  if (!ctx) return { error: 'Tu sesión venció. Vuelve a iniciar sesión.' }
  try {
    const data = await fn(ctx)
    revalidatePath(`/${slug}`, 'layout')
    return { ok: true, ...(data && typeof data === 'object' && 'password' in data ? { data: data as Record<string, string> } : {}) }
  } catch (e) {
    return toError(e)
  }
}

// ---------- Sesión ----------

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const slug = String(form.get('tenant'))
  const tenant = await findTenant(slug)
  if (!tenant) return { error: 'Empresa no encontrada' }
  try {
    const s = await login(tenant, fields(form))
    ;(await cookies()).set(sessionCookie(slug), s.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: s.maxAge })
  } catch (e) {
    return toError(e)
  }
  redirect(`/${slug}`)
}

export async function logoutAction(form: FormData) {
  const slug = String(form.get('tenant'))
  const tenant = await findTenant(slug)
  const jar = await cookies()
  if (tenant) await logout(tenant, jar.get(sessionCookie(slug))?.value)
  jar.delete(sessionCookie(slug))
  redirect(`/${slug}/login`)
}

export async function registerAction(_: ActionState, form: FormData): Promise<ActionState> {
  let slug: string
  try {
    slug = (await registerTenant(fields(form))).slug
    const tenant = (await findTenant(slug))!
    const s = await login(tenant, { email: form.get('email'), password: form.get('password') })
    ;(await cookies()).set(sessionCookie(slug), s.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: s.maxAge })
  } catch (e) {
    return toError(e)
  }
  redirect(`/${slug}`)
}

export async function changePasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const res = await run(form, (ctx) => changePassword(ctx.tenant, ctx.user, fields(form)))
  if (res.ok) redirect(`/${form.get('tenant')}`)
  return res
}

// ---------- Solicitudes ----------

export const requestVacation = async (_: ActionState, form: FormData) => run(form, (ctx) => req.requestVacation(ctx, fields(form)))
export const requestPermission = async (_: ActionState, form: FormData) => run(form, (ctx) => req.requestPermission(ctx, fields(form)))
export const requestDataChange = async (_: ActionState, form: FormData) => run(form, (ctx) => req.requestDataChange(ctx, fields(form)))
export const requestService = async (_: ActionState, form: FormData) => run(form, (ctx) => req.requestService(ctx, fields(form)))
export async function decideRequest(form: FormData) { await run(form, (ctx) => req.decideRequest(ctx, String(form.get('id')), fields(form))) }
export async function cancelRequest(form: FormData) { await run(form, (ctx) => req.cancelRequest(ctx, String(form.get('id')))) }

// ---------- Documentos ----------

export const signDocument = async (_: ActionState, form: FormData) => run(form, (ctx) => docs.signDocument(ctx, String(form.get('id')), fields(form)))
export async function generateCertificate(form: FormData) { await run(form, (ctx) => docs.generateCertificate(ctx, fields(form))) }

// ---------- Onboarding ----------

export async function toggleTask(form: FormData) { await run(form, (ctx) => onb.toggleTask(ctx, String(form.get('task')))) }
export const hireEmployee = async (_: ActionState, form: FormData) => run(form, (ctx) => onb.hireEmployee(ctx, fields(form)))

// ---------- Asistencia y desempeño ----------

export async function clock(form: FormData) { await run(form, (ctx) => ops.clock(ctx)) }
export const moveInBox = async (form: FormData) => run(form, (ctx) => ops.moveInBox(ctx, fields(form)))
export async function updateObjective(form: FormData) { await run(form, (ctx) => ops.updateObjective(ctx, String(form.get('id')), fields(form))) }

// ---------- Cultura ----------

export async function toggleLike(form: FormData) { await run(form, (ctx) => culture.toggleLike(ctx, String(form.get('post')))) }
export const publishNews = async (_: ActionState, form: FormData) => run(form, (ctx) => culture.publishNews(ctx, fields(form)))
export async function deletePost(form: FormData) { await run(form, (ctx) => culture.deletePost(ctx, String(form.get('post')))) }
export const giveRecognition = async (_: ActionState, form: FormData) => run(form, (ctx) => culture.giveRecognition(ctx, fields(form)))
export async function toggleFavorite(form: FormData) { await run(form, (ctx) => culture.toggleFavorite(ctx, String(form.get('benefit')))) }

// ---------- Administración ----------

export const updateBrand = async (_: ActionState, form: FormData) => run(form, (ctx) => admin.updateBrand(ctx, fields(form)))
export async function changeRole(form: FormData) { await run(form, (ctx) => admin.changeRole(ctx, String(form.get('employee')), fields(form))) }
export const grantAccess = async (_: ActionState, form: FormData) => run(form, (ctx) => admin.grantAccess(ctx, String(form.get('employee'))))
export async function revokeAccess(form: FormData) { await run(form, (ctx) => admin.revokeAccess(ctx, String(form.get('employee')))) }
