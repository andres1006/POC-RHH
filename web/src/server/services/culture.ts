import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant } from '../db/client'
import { employees, favorites, postLikes, posts } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { BENEFITS, VALUES } from '@/modules/culture/values'

/** Feed con conteo de reacciones y si el usuario ya reaccionó. */
export function listFeed(ctx: Ctx, kind?: 'recognition') {
  return withTenant(ctx.tenant.id, (tx) =>
    tx.select({
      post: posts,
      likes: sql<number>`(${posts.baseReactions} + (select count(*) from post_likes pl where pl.post_id = ${posts.id}))::int`,
      liked: sql<boolean>`exists(select 1 from post_likes pl where pl.post_id = ${posts.id} and pl.employee_id = ${ctx.user.employeeId})`,
    }).from(posts).where(kind ? eq(posts.kind, kind) : undefined).orderBy(desc(posts.date), desc(posts.createdAt)))
}

export function toggleLike(ctx: Ctx, postId: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const del = await tx.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.employeeId, ctx.user.employeeId))).returning()
    if (!del.length) await tx.insert(postLikes).values({ tenantId: ctx.tenant.id, postId, employeeId: ctx.user.employeeId })
  })
}

export const NewsInput = z.object({ body: z.string().trim().min(10, 'Escribe al menos 10 caracteres').max(1000) })

export function publishNews(ctx: Ctx, input: unknown) {
  assertCan(ctx, 'feed.publish')
  const { body } = NewsInput.parse(input)
  return withTenant(ctx.tenant.id, (tx) => tx.insert(posts).values({ tenantId: ctx.tenant.id, authorId: ctx.user.employeeId, kind: 'news', body }).returning())
}

export function deletePost(ctx: Ctx, id: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const [p] = await tx.select().from(posts).where(eq(posts.id, id))
    if (!p) throw new AppError(404, 'Publicación no encontrada')
    if (p.authorId !== ctx.user.employeeId) assertCan(ctx, 'feed.publish')
    await tx.delete(posts).where(eq(posts.id, id))
  })
}

export const RecognitionInput = z.object({ to: z.string().uuid('Elige un compañero'), value: z.enum(VALUES), message: z.string().trim().min(10, 'Escribe al menos 10 caracteres').max(400) })

export function giveRecognition(ctx: Ctx, input: unknown) {
  const { to, value, message } = RecognitionInput.parse(input)
  if (to === ctx.user.employeeId) throw new AppError(400, 'No puedes reconocerte a ti mismo')
  return withTenant(ctx.tenant.id, async (tx) => {
    const [target] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, to))
    if (!target) throw new AppError(400, 'Elige un compañero')
    return tx.insert(posts).values({ tenantId: ctx.tenant.id, authorId: ctx.user.employeeId, kind: 'recognition', toId: to, value, body: message }).returning()
  })
}

export const listFavorites = (ctx: Ctx) =>
  withTenant(ctx.tenant.id, async (tx) => new Set((await tx.select().from(favorites).where(eq(favorites.employeeId, ctx.user.employeeId))).map((f) => f.benefitId)))

export function toggleFavorite(ctx: Ctx, benefitId: string) {
  if (!BENEFITS.some((b) => b.id === benefitId)) throw new AppError(404, 'Beneficio no encontrado')
  return withTenant(ctx.tenant.id, async (tx) => {
    const del = await tx.delete(favorites).where(and(eq(favorites.employeeId, ctx.user.employeeId), eq(favorites.benefitId, benefitId))).returning()
    if (!del.length) await tx.insert(favorites).values({ tenantId: ctx.tenant.id, employeeId: ctx.user.employeeId, benefitId })
  })
}
