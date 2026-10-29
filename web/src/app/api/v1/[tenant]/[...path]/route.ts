// API REST v1 por empresa: /api/v1/{tenant}/...
// Es la frontera para sacar el backend: cada ruta solo autentica, parsea y llama a un servicio de src/server/services.
// Autenticación: cookie de sesión (web) o `Authorization: Bearer <token>` (apps/otros clientes; token de POST auth/login).
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { AppError, type Ctx } from '@/server/context'
import { findTenant, login, logout, resolveSession, changePassword } from '@/server/auth/service'
import { sessionCookie } from '@/server/session'
import * as people from '@/server/services/people'
import * as req from '@/server/services/requests'
import * as docs from '@/server/services/documents'
import * as onb from '@/server/services/onboarding'
import * as ops from '@/server/services/operations'
import * as culture from '@/server/services/culture'
import * as admin from '@/server/services/admin'
import * as analytics from '@/server/services/analytics'
import { BENEFITS } from '@/modules/culture/values'

type In = { ctx: Ctx; p: Record<string, string>; body: unknown; q: URLSearchParams }
type Handler = (i: In) => Promise<unknown>

const ROUTES: [method: string, pattern: string, handler: Handler][] = [
  ['GET', 'me', ({ ctx }) => people.getMe(ctx)],
  ['POST', 'me/password', ({ ctx, body }) => changePassword(ctx.tenant, ctx.user, body)],
  ['GET', 'employees', ({ ctx, q }) => people.listEmployees(ctx, { q: q.get('q') ?? undefined, area: q.get('area') ?? undefined })],
  ['GET', 'employees/:id', ({ ctx, p }) => people.getEmployee(ctx, p.id)],
  ['PATCH', 'employees/:id/role', ({ ctx, p, body }) => admin.changeRole(ctx, p.id, body)],
  ['GET', 'balance', ({ ctx }) => req.getBalance(ctx)],
  ['GET', 'requests', ({ ctx, q }) => req.listRequests(ctx, (q.get('scope') as 'mine' | 'to_approve' | 'all') ?? 'all')],
  ['POST', 'requests/vacation', ({ ctx, body }) => req.requestVacation(ctx, body)],
  ['POST', 'requests/permission', ({ ctx, body }) => req.requestPermission(ctx, body)],
  ['POST', 'requests/data-change', ({ ctx, body }) => req.requestDataChange(ctx, body)],
  ['POST', 'requests/service', ({ ctx, body }) => req.requestService(ctx, body)],
  ['POST', 'requests/:id/decision', ({ ctx, p, body }) => req.decideRequest(ctx, p.id, body)],
  ['POST', 'requests/:id/cancel', ({ ctx, p }) => req.cancelRequest(ctx, p.id)],
  ['GET', 'documents', ({ ctx }) => docs.listMyDocuments(ctx)],
  ['GET', 'documents/policy-report', ({ ctx }) => docs.policyReport(ctx)],
  ['POST', 'documents/certificates', ({ ctx, body }) => docs.generateCertificate(ctx, body)],
  ['POST', 'documents/:id/sign', ({ ctx, p, body }) => docs.signDocument(ctx, p.id, body)],
  ['GET', 'onboardings', ({ ctx }) => onb.listOnboardings(ctx)],
  ['POST', 'onboardings', ({ ctx, body }) => onb.hireEmployee(ctx, body)],
  ['POST', 'onboarding-tasks/:id/toggle', ({ ctx, p }) => onb.toggleTask(ctx, p.id)],
  ['GET', 'attendance/me', ({ ctx }) => ops.listMyMarks(ctx)],
  ['POST', 'attendance/clock', ({ ctx }) => ops.clock(ctx)],
  ['GET', 'attendance/team', ({ ctx }) => ops.teamAttendance(ctx)],
  ['GET', 'performance/nine-box', ({ ctx }) => ops.nineBox(ctx)],
  ['POST', 'performance/reviews', ({ ctx, body }) => ops.moveInBox(ctx, body)],
  ['PATCH', 'objectives/:id', ({ ctx, p, body }) => ops.updateObjective(ctx, p.id, body)],
  ['GET', 'feed', ({ ctx, q }) => culture.listFeed(ctx, q.get('kind') === 'recognition' ? 'recognition' : undefined)],
  ['POST', 'feed/news', ({ ctx, body }) => culture.publishNews(ctx, body)],
  ['DELETE', 'feed/:id', ({ ctx, p }) => culture.deletePost(ctx, p.id)],
  ['POST', 'feed/:id/like', ({ ctx, p }) => culture.toggleLike(ctx, p.id)],
  ['POST', 'recognitions', ({ ctx, body }) => culture.giveRecognition(ctx, body)],
  ['GET', 'benefits', async ({ ctx }) => { const fav = await culture.listFavorites(ctx); return BENEFITS.map((b) => ({ ...b, favorite: fav.has(b.id) })) }],
  ['POST', 'benefits/:id/favorite', ({ ctx, p }) => culture.toggleFavorite(ctx, p.id)],
  ['GET', 'analytics/people', ({ ctx }) => analytics.peopleAnalytics(ctx)],
  ['PATCH', 'tenant/brand', ({ ctx, body }) => admin.updateBrand(ctx, body)],
  ['GET', 'access', ({ ctx }) => admin.listAccess(ctx)],
  ['POST', 'access/:id', ({ ctx, p }) => admin.grantAccess(ctx, p.id)],
  ['DELETE', 'access/:id', ({ ctx, p }) => admin.revokeAccess(ctx, p.id)],
]

function match(method: string, path: string[]) {
  for (const [m, pattern, handler] of ROUTES) {
    if (m !== method) continue
    const parts = pattern.split('/')
    if (parts.length !== path.length) continue
    const p: Record<string, string> = {}
    if (parts.every((seg, i) => (seg.startsWith(':') ? ((p[seg.slice(1)] = path[i]), true) : seg === path[i]))) return { handler, p }
  }
  return null
}

async function readBody(r: NextRequest) {
  if (r.method === 'GET' || r.method === 'DELETE') return {}
  const type = r.headers.get('content-type') ?? ''
  if (type.includes('application/json')) return r.json().catch(() => ({}))
  if (type.includes('form')) return Object.fromEntries(await r.formData())
  return {}
}

const json = (data: unknown, status = 200) => NextResponse.json(data ?? { ok: true }, { status })

async function handle(r: NextRequest, { params }: { params: Promise<{ tenant: string; path: string[] }> }) {
  const { tenant: slug, path } = await params
  try {
    const tenant = await findTenant(slug)
    if (!tenant) throw new AppError(404, 'Empresa no encontrada')
    const key = path.join('/')
    const token = r.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1] ?? r.cookies.get(sessionCookie(slug))?.value

    if (r.method === 'POST' && key === 'auth/login') {
      const s = await login(tenant, await readBody(r))
      const res = json({ token: s.token, expiresIn: s.maxAge })
      res.cookies.set(sessionCookie(slug), s.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: s.maxAge })
      return res
    }
    if (r.method === 'POST' && key === 'auth/logout') {
      await logout(tenant, token)
      const res = json({ ok: true })
      res.cookies.delete(sessionCookie(slug))
      return res
    }

    // PDF: respuesta binaria
    const pdf = r.method === 'GET' && path.length === 3 && path[0] === 'documents' && path[2] === 'pdf'
    const user = await resolveSession(tenant, token)
    if (!user) throw new AppError(401, 'Sesión no válida o vencida')
    const ctx: Ctx = { tenant, user }
    if (pdf) {
      const { filename, pdf: bytes } = await docs.documentPdf(ctx, path[1])
      return new NextResponse(new Uint8Array(bytes), { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${encodeURIComponent(filename)}"` } })
    }

    const m = match(r.method, path)
    if (!m) throw new AppError(404, `Ruta no encontrada: ${r.method} ${key}`)
    return json(await m.handler({ ctx, p: m.p, body: await readBody(r), q: r.nextUrl.searchParams }))
  } catch (e) {
    if (e instanceof AppError) return json({ error: e.message }, e.status)
    if (e instanceof ZodError) return json({ error: e.issues[0]?.message ?? 'Datos inválidos', issues: e.issues }, 400)
    console.error(e)
    return json({ error: 'Error interno' }, 500)
  }
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE }
