// Esquema de datos. Toda tabla de negocio lleva tenant_id y queda protegida por RLS (ver drizzle/0001_rls.sql).
import { sql } from 'drizzle-orm'
import { boolean, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['employee', 'leader', 'hr', 'admin'])
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected', 'cancelled'])
export const docStatusEnum = pgEnum('doc_status', ['pending_signature', 'signed', 'issued'])

const id = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`)
const tenantId = () => uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' })
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const tenants = pgTable('tenants', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  primaryColor: text('primary_color').notNull().default('#0071E3'),
  tagline: text('tagline').notNull().default(''),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
})

export const employees = pgTable('employees', {
  id: id(),
  tenantId: tenantId(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  managerId: uuid('manager_id'),
  role: roleEnum('role').notNull().default('employee'),
  email: text('email').notNull(),
  phone: text('phone').notNull().default(''),
  hireDate: date('hire_date').notNull(),
  birthDate: date('birth_date'),
  contractType: text('contract_type').notNull().default('Indefinido'),
  salary: integer('salary').notNull().default(0),
  documentId: text('document_id').notNull().default(''),
  eps: text('eps').notNull().default(''),
  pension: text('pension').notNull().default(''),
  takenDays: integer('taken_days').notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index('employees_tenant_idx').on(t.tenantId, t.department), uniqueIndex('employees_email_uq').on(t.tenantId, t.email)])

/** Credenciales: una cuenta por empleado que puede iniciar sesión. */
export const users = pgTable('users', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('users_email_uq').on(t.tenantId, t.email)])

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const employeeEvents = pgTable('employee_events', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  kind: text('kind').notNull(),
  changes: jsonb('changes').$type<[string, string, string][]>().notNull(),
})

export type Step = { approverId: string; status: 'pending' | 'approved' | 'rejected'; decidedAt?: string; comment?: string }
export type RequestPayload = { from?: string; to?: string; days?: number; kind?: string; hours?: number; note?: string; changes?: Record<string, string> }

export const requests = pgTable('requests', {
  id: id(),
  tenantId: tenantId(),
  type: text('type').$type<'vacation' | 'permission' | 'certificate' | 'data_change'>().notNull(),
  title: text('title').notNull(),
  requesterId: uuid('requester_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  payload: jsonb('payload').$type<RequestPayload>().notNull(),
  status: requestStatusEnum('status').notNull().default('pending'),
  steps: jsonb('steps').$type<Step[]>().notNull(),
  createdAt: date('created_at').notNull().default(sql`current_date`),
  closedAt: date('closed_at'),
}, (t) => [index('requests_tenant_idx').on(t.tenantId, t.status)])

export const posts = pgTable('posts', {
  id: id(),
  tenantId: tenantId(),
  authorId: uuid('author_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'news' | 'recognition'>().notNull(),
  body: text('body').notNull(),
  date: date('date').notNull().default(sql`current_date`),
  baseReactions: integer('base_reactions').notNull().default(0),
  toId: uuid('to_id').references(() => employees.id, { onDelete: 'cascade' }),
  value: text('value'),
  createdAt: createdAt(),
})

export const postLikes = pgTable('post_likes', {
  tenantId: tenantId(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.postId, t.employeeId] })])

export const documents = pgTable('documents', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  status: docStatusEnum('status').notNull(),
  createdAt: date('created_at').notNull().default(sql`current_date`),
  signedAt: date('signed_at'),
})

export const onboardings = pgTable('onboardings', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),
})

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: id(),
  tenantId: tenantId(),
  onboardingId: uuid('onboarding_id').notNull().references(() => onboardings.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  owner: text('owner').notNull(),
  due: date('due').notNull(),
  doneAt: date('done_at'),
})

export const attendanceMarks = pgTable('attendance_marks', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'in' | 'out'>().notNull(),
  /** Hora local de la sede (Colombia), 'YYYY-MM-DDTHH:MM:SS' */
  at: text('at').notNull(),
}, (t) => [index('marks_employee_idx').on(t.tenantId, t.employeeId, t.at)])

export const reviews = pgTable('reviews', {
  tenantId: tenantId(),
  employeeId: uuid('employee_id').primaryKey().references(() => employees.id, { onDelete: 'cascade' }),
  performance: integer('performance').notNull(),
  potential: integer('potential').notNull(),
})

export const objectives = pgTable('objectives', {
  id: id(),
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  progress: integer('progress').notNull().default(0),
})

export const favorites = pgTable('favorites', {
  tenantId: tenantId(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  benefitId: text('benefit_id').notNull(),
}, (t) => [primaryKey({ columns: [t.employeeId, t.benefitId] })])

/** Tablas con tenant_id sujetas a RLS (se usa en la migración de políticas). */
export const TENANT_TABLES = ['employees', 'users', 'employee_events', 'requests', 'posts', 'post_likes', 'documents', 'onboardings', 'onboarding_tasks', 'attendance_marks', 'reviews', 'objectives', 'favorites'] as const
