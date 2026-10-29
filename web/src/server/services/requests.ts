import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant, type Tx } from '../db/client'
import { documents, employeeEvents, employees, requests } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { can } from '@/platform/rbac'
import { today } from '@/platform/format'
import { businessDays, leaveBalance } from '@/modules/leave/domain'
import { PERMISSION_KINDS, decide, isAwaiting, type HrRequest } from '@/modules/requests/domain'
import { findService, resolveServiceTitle } from '@/modules/requests/catalog'

export type RequestRow = typeof requests.$inferSelect
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')

// ---------- Consultas ----------

/** Solicitudes visibles para el usuario: RR. HH. ve todas; el resto, las suyas y las que debe aprobar. */
export function listRequests(ctx: Ctx, scope: 'mine' | 'to_approve' | 'all' = 'all') {
  return withTenant(ctx.tenant.id, async (tx) => {
    const me = ctx.user.employeeId
    const rows = await tx.select().from(requests).orderBy(desc(requests.createdAt), desc(requests.id))
    const visible = can(ctx.user.role, 'requests.view_all') ? rows : rows.filter((r) => r.requesterId === me || r.steps.some((s) => s.approverId === me))
    if (scope === 'mine') return visible.filter((r) => r.requesterId === me)
    if (scope === 'to_approve') return visible.filter((r) => isAwaiting(r as HrRequest, me))
    return visible
  })
}

async function balanceTx(tx: Tx, employeeId: string) {
  const [e] = await tx.select().from(employees).where(eq(employees.id, employeeId))
  if (!e) throw new AppError(404, 'Persona no encontrada')
  const [sum] = await tx.select({
    approved: sql<number>`coalesce(sum((payload->>'days')::int) filter (where status = 'approved'), 0)::int`,
    pending: sql<number>`coalesce(sum((payload->>'days')::int) filter (where status = 'pending'), 0)::int`,
  }).from(requests).where(and(eq(requests.requesterId, employeeId), eq(requests.type, 'vacation')))
  return leaveBalance(e.hireDate, today(), e.takenDays + sum.approved, sum.pending)
}

export const getBalance = (ctx: Ctx, employeeId = ctx.user.employeeId) => withTenant(ctx.tenant.id, (tx) => balanceTx(tx, employeeId))

// ---------- Creación ----------

async function approverFor(tx: Tx, ctx: Ctx, to: 'manager' | 'hr') {
  const [me] = await tx.select().from(employees).where(eq(employees.id, ctx.user.employeeId))
  if (to === 'manager' && me.managerId) return me.managerId
  const [hr] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.role, 'hr')).limit(1)
  const [admin] = hr ? [hr] : await tx.select({ id: employees.id }).from(employees).where(eq(employees.role, 'admin')).limit(1)
  if (!admin) throw new AppError(409, 'No hay quién apruebe esta solicitud')
  return admin.id
}

async function insertRequest(tx: Tx, ctx: Ctx, r: Pick<RequestRow, 'type' | 'title' | 'payload'>, approverId: string) {
  const [row] = await tx.insert(requests).values({ ...r, tenantId: ctx.tenant.id, requesterId: ctx.user.employeeId, steps: [{ approverId, status: 'pending' }] }).returning()
  return row
}

export const VacationInput = z.object({ from: date, to: date, note: z.string().max(500).optional() })

export function requestVacation(ctx: Ctx, input: unknown) {
  const { from, to, note } = VacationInput.parse(input)
  if (from < today()) throw new AppError(400, 'La fecha de inicio no puede ser pasada')
  const days = businessDays(from, to)
  if (days === 0) throw new AppError(400, 'El rango no tiene días hábiles')
  return withTenant(ctx.tenant.id, async (tx) => {
    const { available } = await balanceTx(tx, ctx.user.employeeId)
    if (days > available) throw new AppError(400, `Solo tienes ${available} días disponibles`)
    return insertRequest(tx, ctx, { type: 'vacation', title: `Vacaciones ${days} días`, payload: { from, to, days, note } }, await approverFor(tx, ctx, 'manager'))
  })
}

export const PermissionInput = z.object({ kind: z.enum(PERMISSION_KINDS), from: date, hours: z.coerce.number().int().min(1).max(8).optional(), note: z.string().max(500).optional() })

export function requestPermission(ctx: Ctx, input: unknown) {
  const { kind, from, hours, note } = PermissionInput.parse(input)
  if (from < today()) throw new AppError(400, 'La fecha no puede ser pasada')
  const title = hours ? `${kind} · ${hours} h` : `${kind} · día completo`
  return withTenant(ctx.tenant.id, async (tx) =>
    insertRequest(tx, ctx, { type: 'permission', title, payload: { kind, from, to: from, hours, note } }, await approverFor(tx, ctx, 'manager')))
}

export const ServiceInput = z.object({ service: z.string().min(1), option: z.string().optional(), note: z.string().max(500).optional() })

export function requestService(ctx: Ctx, input: unknown) {
  const { service: id, option, note } = ServiceInput.parse(input)
  const service = findService(id)
  if (!service) throw new AppError(400, 'Ese servicio no está disponible')
  const title = resolveServiceTitle(id, option)
  if (!title) throw new AppError(400, 'Elige una opción del servicio')
  return withTenant(ctx.tenant.id, async (tx) =>
    insertRequest(tx, ctx, { type: 'data_change', title, payload: { note: note || title, kind: id } }, await approverFor(tx, ctx, service.approver)))
}

export const DataChangeInput = z.object({ phone: z.string().trim().regex(/^\+?[\d\s]{7,16}$/, 'Teléfono inválido') })

export function requestDataChange(ctx: Ctx, input: unknown) {
  const { phone } = DataChangeInput.parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const [me] = await tx.select().from(employees).where(eq(employees.id, ctx.user.employeeId))
    if (me.phone === phone) throw new AppError(400, 'No cambiaste ningún dato')
    return insertRequest(tx, ctx, { type: 'data_change', title: 'Actualización de teléfono', payload: { changes: { phone } } }, await approverFor(tx, ctx, 'hr'))
  })
}

// ---------- Aprobación ----------

export const DecisionInput = z.object({ decision: z.enum(['approve', 'reject']), comment: z.string().max(300).optional() })

/** Aplica la decisión y, si queda aprobada, sus efectos en la misma transacción. */
export function decideRequest(ctx: Ctx, id: string, input: unknown) {
  assertCan(ctx, 'requests.approve')
  const { decision, comment } = DecisionInput.parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const [row] = await tx.select().from(requests).where(eq(requests.id, id)).for('update')
    if (!row) throw new AppError(404, 'Solicitud no encontrada')
    let next: HrRequest
    try { next = decide(row as HrRequest, ctx.user.employeeId, decision, today(), comment) } catch (e) { throw new AppError(403, (e as Error).message) }
    await tx.update(requests).set({ steps: next.steps, status: next.status, closedAt: next.closedAt ?? null }).where(eq(requests.id, id))

    if (next.status === 'approved' && row.type === 'vacation') {
      await tx.insert(documents).values({ tenantId: ctx.tenant.id, employeeId: row.requesterId, name: `Solicitud de vacaciones ${row.payload.from} a ${row.payload.to}`, kind: 'Vacaciones', status: 'pending_signature' })
    }
    if (next.status === 'approved' && row.type === 'data_change' && row.payload.changes?.phone) {
      const [e] = await tx.select().from(employees).where(eq(employees.id, row.requesterId))
      await tx.update(employees).set({ phone: row.payload.changes.phone }).where(eq(employees.id, row.requesterId))
      await tx.insert(employeeEvents).values({ tenantId: ctx.tenant.id, employeeId: row.requesterId, date: today(), kind: 'Actualización de datos', changes: [['Teléfono', e.phone, row.payload.changes.phone]] })
    }
    return { ...row, ...next }
  })
}

export function cancelRequest(ctx: Ctx, id: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const [row] = await tx.select().from(requests).where(and(eq(requests.id, id), eq(requests.requesterId, ctx.user.employeeId)))
    if (!row) throw new AppError(404, 'Solicitud no encontrada')
    if (row.status !== 'pending') throw new AppError(409, 'Solo se pueden cancelar solicitudes pendientes')
    await tx.update(requests).set({ status: 'cancelled', closedAt: today() }).where(eq(requests.id, id))
  })
}
