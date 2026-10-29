import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant } from '../db/client'
import { documents, employees } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { can } from '@/platform/rbac'
import { fullName, today } from '@/platform/format'
import { simplePdf } from '../pdf'

export type DocRow = typeof documents.$inferSelect

// shortcut: firma simulada con código fijo; en producción OTP por correo/SMS y PDF sellado.
export const DEMO_OTP = '123456'

export const listMyDocuments = (ctx: Ctx) =>
  withTenant(ctx.tenant.id, (tx) => tx.select().from(documents).where(eq(documents.employeeId, ctx.user.employeeId)).orderBy(desc(documents.createdAt)))

export const SignInput = z.object({ accept: z.literal('on', { message: 'Debes aceptar el contenido del documento' }), code: z.string() })

export function signDocument(ctx: Ctx, id: string, input: unknown) {
  const parsed = SignInput.safeParse(input)
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message)
  if (parsed.data.code !== DEMO_OTP) throw new AppError(400, 'Código incorrecto (en el demo es 123456)')
  return withTenant(ctx.tenant.id, async (tx) => {
    const [d] = await tx.select().from(documents).where(and(eq(documents.id, id), eq(documents.employeeId, ctx.user.employeeId)))
    if (!d || d.status !== 'pending_signature') throw new AppError(409, 'Documento no disponible para firma')
    await tx.update(documents).set({ status: 'signed', signedAt: today() }).where(eq(documents.id, id))
  })
}

export const CERTS = { laboral: 'Certificado laboral', antiguedad: 'Certificado de antigüedad', ingresos: 'Certificado de ingresos y retenciones' } as const

export function generateCertificate(ctx: Ctx, input: unknown) {
  const { kind } = z.object({ kind: z.enum(['laboral', 'antiguedad', 'ingresos']) }).parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const [d] = await tx.insert(documents).values({ tenantId: ctx.tenant.id, employeeId: ctx.user.employeeId, name: `${CERTS[kind]} ${today()}`, kind: 'Certificado', status: 'issued' }).returning()
    return d
  })
}

/** PDF del documento: el dueño, o RR. HH. para cualquier persona. */
export function documentPdf(ctx: Ctx, id: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const [row] = await tx.select({ d: documents, e: employees }).from(documents).innerJoin(employees, eq(employees.id, documents.employeeId)).where(eq(documents.id, id))
    if (!row || (row.d.employeeId !== ctx.user.employeeId && !can(ctx.user.role, 'people.read_all'))) throw new AppError(404, 'Documento no encontrado')
    const { d, e } = row
    const lines = [
      ctx.tenant.name.toUpperCase(), '', d.name, '',
      d.kind === 'Certificado'
        ? `La empresa ${ctx.tenant.name} certifica que ${fullName(e)}, identificado(a) con CC ${e.documentId}, labora en la compañía desde el ${e.hireDate} desempeñando el cargo de ${e.position} con contrato ${e.contractType.toLowerCase()}.`
        : `Documento a nombre de ${fullName(e)} (${e.position}).`,
      '', `Fecha de emisión: ${d.createdAt}`,
      d.signedAt ? `Firmado electrónicamente por ${fullName(e)} el ${d.signedAt}.` : 'Pendiente de firma.',
    ]
    return { filename: `${d.name.replace(/[^\w\- ]+/g, '').trim() || 'documento'}.pdf`, pdf: simplePdf(lines) }
  })
}

/** Avance de firmas de la política por área (vista de RR. HH.). */
export function policyReport(ctx: Ctx) {
  assertCan(ctx, 'people.read_all')
  return withTenant(ctx.tenant.id, async (tx) => {
    const rows = await tx.select({ area: employees.department, status: documents.status }).from(documents).innerJoin(employees, eq(employees.id, documents.employeeId)).where(eq(documents.kind, 'Política'))
    const areas = [...new Set(rows.map((r) => r.area))].sort()
    return areas.map((area) => {
      const docs = rows.filter((r) => r.area === area)
      return { area, total: docs.length, signed: docs.filter((d) => d.status === 'signed').length }
    })
  })
}
