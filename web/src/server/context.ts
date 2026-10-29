// Contexto de cada operación: tenant + usuario autenticado. Lo construyen las páginas, las Server Actions
// y la API REST; los servicios solo reciben un Ctx y nunca leen cookies ni headers.
import type { Role, Permission } from '@/platform/rbac'
import { can } from '@/platform/rbac'
import type { tenants } from './db/schema'

export type Tenant = typeof tenants.$inferSelect
export type SessionUser = { userId: string; employeeId: string; role: Role; firstName: string; lastName: string; position: string; mustChangePassword: boolean }
export type Ctx = { tenant: Tenant; user: SessionUser }

export class AppError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409, message: string) { super(message) }
}

export function assertCan(ctx: Ctx, p: Permission) {
  if (!can(ctx.user.role, p)) throw new AppError(403, 'No tienes permiso para esta acción')
}
