// Pobla Postgres con las empresas demo. Corre con el usuario dueño (salta RLS).
//   pnpm db:seed             → solo si la base está vacía
//   pnpm db:seed --reset     → borra todo y vuelve a sembrar
//   pnpm db:seed:eficacia    → agrega o reemplaza solo Eficacia, sin tocar las demás
import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, sql } from 'drizzle-orm'
import postgres from 'postgres'
import * as s from '../src/server/db/schema'
import { buildDemoData, DEMO_TENANTS, type Employee } from '../src/server/db/demo-data'
import { hashPassword } from '../src/server/auth/password'

// Contraseña de las cuentas demo (solo datos de prueba). Documentada en README.
export const DEMO_PASSWORD = 'Demo1234!'

const OBJECTIVES = ['Cumplir el 95 % de entregas a tiempo', 'Completar la ruta de formación del cargo', 'Proponer una mejora de proceso al trimestre']
const EFICACIA_OBJECTIVES = ['Cubrir el 98 % de las visitas programadas al punto de venta', 'Mantener la calidad de la operación por encima de la meta del trimestre', 'Completar la ruta de formación del cargo']

function accountsFor(tenantId: string, people: Employee[]) {
  if (tenantId === 't-eficacia') {
    const leader = people.find((e) => e.role === 'leader' && e.department === 'Fuerza de Ventas')!
    return [people.find((e) => e.managerId === leader.id)!, leader, people.find((e) => e.role === 'hr')!, people.find((e) => e.email === 'andres.agudelo@eficacia.com')!]
  }
  const leader = people.find((e) => e.role === 'leader' && e.department === 'Tecnología')!
  return [people.find((e) => e.managerId === leader.id)!, leader, people.find((e) => e.role === 'hr')!, people.find((e) => e.role === 'admin')!]
}

async function main() {
  const client = postgres(process.env.MIGRATION_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/nexorh', { max: 1 })
  const db = drizzle(client, { schema: s })
  const reset = process.argv.includes('--reset')
  const onlyEficacia = process.argv.includes('--eficacia')
  const tenants = onlyEficacia ? DEMO_TENANTS.filter((t) => t.slug === 'eficacia') : DEMO_TENANTS
  const tenantIds = new Set(tenants.map((t) => t.id))

  if (!onlyEficacia) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(s.tenants)
    if (count > 0 && !reset) { console.log(`Base con ${count} empresas: no se siembra (usa --reset, o --eficacia para agregar solo esa empresa).`); await client.end(); return }
    if (reset) await db.execute(sql`truncate tenants cascade`)
  }

  const data = buildDemoData()
  const employees = data.employees.filter((e) => tenantIds.has(e.tenantId))
  const ids = new Map<string, string>()
  const uid = (key: string) => { if (!ids.has(key)) ids.set(key, randomUUID()); return ids.get(key)! }
  const ref = (key?: string) => (key ? uid(key) : null)

  await db.transaction(async (tx) => {
    if (onlyEficacia) await tx.delete(s.tenants).where(eq(s.tenants.slug, 'eficacia'))
    await tx.insert(s.tenants).values(tenants.map((t) => ({ id: uid(t.id), slug: t.slug, name: t.name, primaryColor: t.primaryColor, tagline: t.tagline, isDemo: true })))
    await tx.insert(s.employees).values(employees.map((e) => ({
      id: uid(e.id), tenantId: uid(e.tenantId), firstName: e.firstName, lastName: e.lastName, position: e.position, department: e.department,
      managerId: ref(e.managerId), role: e.role, email: e.email, phone: e.phone, hireDate: e.hireDate, birthDate: e.birthDate,
      contractType: e.contractType, salary: e.salary, documentId: e.documentId, eps: e.eps, pension: e.pension, takenDays: e.takenDays,
    })))
    const tenantOf = new Map(employees.map((e) => [e.id, uid(e.tenantId)]))
    await tx.insert(s.employeeEvents).values(data.events.filter((ev) => tenantOf.has(ev.employeeId)).map((ev) => ({ tenantId: tenantOf.get(ev.employeeId)!, employeeId: uid(ev.employeeId), date: ev.date, kind: ev.kind, changes: ev.changes })))
    await tx.insert(s.requests).values(data.requests.filter((r) => tenantIds.has(r.tenantId)).map((r) => ({
      id: uid(r.id), tenantId: uid(r.tenantId), type: r.type, title: r.title, requesterId: uid(r.requesterId), payload: r.payload, status: r.status,
      steps: r.steps.map((st) => ({ ...st, approverId: uid(st.approverId) })), createdAt: r.createdAt, closedAt: r.closedAt ?? null,
    })))
    await tx.insert(s.posts).values(data.posts.filter((p) => tenantIds.has(p.tenantId)).map((p) => ({
      tenantId: uid(p.tenantId), authorId: uid(p.authorId), kind: p.kind, body: p.body, date: p.date, baseReactions: p.reactions, toId: ref(p.toId), value: p.value ?? null,
    })))
    await tx.insert(s.documents).values(data.documents.filter((d) => tenantIds.has(d.tenantId)).map((d) => ({ tenantId: uid(d.tenantId), employeeId: uid(d.employeeId), name: d.name, kind: d.kind, status: d.status, createdAt: d.createdAt, signedAt: d.signedAt ?? null })))
    for (const o of data.onboardings.filter((o) => tenantIds.has(o.tenantId))) {
      const obId = uid(o.id)
      await tx.insert(s.onboardings).values({ id: obId, tenantId: uid(o.tenantId), employeeId: uid(o.employeeId), startDate: o.startDate })
      await tx.insert(s.onboardingTasks).values(o.tasks.map((t, i) => ({ tenantId: uid(o.tenantId), onboardingId: obId, position: i, title: t.title, owner: t.owner, due: t.due, doneAt: t.doneAt ?? null })))
    }
    const marks = data.marks.filter((m) => tenantOf.has(m.employeeId))
    for (let i = 0; i < marks.length; i += 500) {
      await tx.insert(s.attendanceMarks).values(marks.slice(i, i + 500).map((m) => ({ tenantId: tenantOf.get(m.employeeId)!, employeeId: uid(m.employeeId), kind: m.kind, at: m.at })))
    }
    await tx.insert(s.reviews).values(data.reviews.filter((r) => tenantOf.has(r.employeeId)).map((r) => ({ tenantId: tenantOf.get(r.employeeId)!, employeeId: uid(r.employeeId), performance: r.performance, potential: r.potential })))
    await tx.insert(s.objectives).values(employees.flatMap((e, i) => (e.tenantId === 't-eficacia' ? EFICACIA_OBJECTIVES : OBJECTIVES).map((title, j) => ({ tenantId: uid(e.tenantId), employeeId: uid(e.id), title, progress: [82, 60, 100][j] - ((i * 7) % 30) }))).map((o) => ({ ...o, progress: Math.max(0, o.progress) })))

    // Cuentas demo: un usuario por rol. En Eficacia el admin es Andres Agudelo.
    const hash = hashPassword(DEMO_PASSWORD)
    for (const t of tenants) {
      const people = employees.filter((e) => e.tenantId === t.id)
      const demo = accountsFor(t.id, people)
      await tx.insert(s.users).values(demo.map((e) => ({ tenantId: uid(t.id), employeeId: uid(e.id), email: e.email, passwordHash: hash })))
      console.log(`${t.name}:`, demo.map((e) => `${e.role}=${e.email}`).join('  '))
    }
  })
  console.log(`Sembrado: ${employees.length} personas, ${data.requests.filter((r) => tenantIds.has(r.tenantId)).length} solicitudes. Contraseña demo: ${DEMO_PASSWORD}`)
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
