// Datos demo deterministas (Andina, Café Montaña y Eficacia). Los usa scripts/seed.ts para poblar Postgres.
// Los ids aquí son textuales; el seed los traduce a UUID.
// Las personas de Eficacia, salvo Andres Agudelo, son ficticias: el organigrama sigue el negocio público de la empresa.
import type { Role } from '@/platform/rbac'
import type { HrRequest } from '@/modules/requests/domain'
import { accruedDays } from '@/modules/leave/domain'

export type Employee = {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  position: string
  department: string
  managerId?: string
  role: Role
  email: string
  phone: string
  hireDate: string
  birthDate: string | null
  contractType: 'Indefinido' | 'Término fijo' | 'Obra o labor'
  salary: number
  documentId: string
  eps: string
  pension: string
  takenDays: number
}

export type EmployeeEvent = { employeeId: string; date: string; kind: 'Ingreso' | 'Cambio de cargo' | 'Ajuste salarial' | 'Actualización de datos'; changes: [string, string, string][] }
export type Post = { id: string; tenantId: string; authorId: string; kind: 'news' | 'recognition'; body: string; date: string; reactions: number; toId?: string; value?: string }

export type Doc = { id: string; tenantId: string; employeeId: string; name: string; kind: 'Contrato' | 'Certificado' | 'Vacaciones' | 'Política' | 'Otrosí'; status: 'pending_signature' | 'signed' | 'issued'; createdAt: string; signedAt?: string }
export type OnboardingTask = { id: string; title: string; owner: 'Nuevo ingreso' | 'Líder' | 'RR. HH.' | 'TI'; due: string; doneAt?: string }
export type Onboarding = { id: string; tenantId: string; employeeId: string; startDate: string; tasks: OnboardingTask[] }
export type Mark = { employeeId: string; kind: 'in' | 'out'; at: string }
export type Review = { employeeId: string; performance: 1 | 2 | 3; potential: 1 | 2 | 3 }

export type DemoData = {
  employees: Employee[]; events: EmployeeEvent[]; requests: HrRequest[]; posts: Post[]
  documents: Doc[]; onboardings: Onboarding[]; marks: Mark[]; reviews: Review[]
}

export const ONBOARDING_TEMPLATE: Omit<OnboardingTask, 'id' | 'due'>[] = [
  { title: 'Firmar contrato laboral', owner: 'Nuevo ingreso' },
  { title: 'Cargar documentos (cédula, certificados, cuenta bancaria)', owner: 'Nuevo ingreso' },
  { title: 'Afiliar a EPS, pensión, ARL y caja de compensación', owner: 'RR. HH.' },
  { title: 'Entregar equipo de cómputo y accesos', owner: 'TI' },
  { title: 'Curso de inducción corporativa', owner: 'Nuevo ingreso' },
  { title: 'Reunión de bienvenida y objetivos de 90 días', owner: 'Líder' },
  { title: 'Presentación con el equipo', owner: 'Líder' },
]

export const addDays = (d: string, n: number) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
export const newOnboarding = (tenantId: string, employeeId: string, startDate: string, doneUntil = 0): Onboarding => ({
  id: `ob-${employeeId}`, tenantId, employeeId, startDate,
  tasks: ONBOARDING_TEMPLATE.map((t, i) => ({ ...t, id: `${employeeId}-t${i}`, due: addDays(startDate, i * 2), doneAt: i < doneUntil ? addDays(startDate, i * 2) : undefined })),
})

const FIRST = ['Laura', 'Andrés', 'Camila', 'Santiago', 'Valentina', 'Juan Pablo', 'Mariana', 'Sebastián', 'Daniela', 'Felipe', 'Natalia', 'Julián', 'Paula', 'Mateo', 'Catalina', 'David', 'Isabella', 'Alejandro', 'Sara', 'Nicolás', 'Manuela', 'Carlos', 'Juliana', 'Esteban', 'Gabriela', 'Diego', 'Carolina', 'Tomás', 'Luisa', 'Simón']
const LAST = ['Gómez', 'Rodríguez', 'Martínez', 'López', 'García', 'Hernández', 'Restrepo', 'Ramírez', 'Torres', 'Castro', 'Vargas', 'Ospina', 'Mejía', 'Arango', 'Jaramillo', 'Rojas', 'Moreno', 'Cardona', 'Salazar', 'Quintero', 'Zapata', 'Muñoz', 'Henao', 'Giraldo']
const EPS = ['Sura', 'Sanitas', 'Compensar', 'Nueva EPS', 'Salud Total']
const PENSION = ['Porvenir', 'Protección', 'Colfondos', 'Colpensiones']

type Area = { name: string; head: string; roles: string[]; size?: number; headRole?: Role; person?: Partial<Employee> }

const AREAS: Area[] = [
  { name: 'Operaciones', head: 'Directora de Operaciones', roles: ['Coordinador de Bodega', 'Analista de Operaciones', 'Auxiliar Logístico', 'Conductor'] },
  { name: 'Comercial', head: 'Director Comercial', roles: ['Ejecutiva de Cuenta', 'Asesor Comercial', 'Analista de Mercadeo'] },
  { name: 'Tecnología', head: 'Líder de Tecnología', roles: ['Desarrollador Full Stack', 'Desarrolladora Frontend', 'Analista QA', 'Ingeniero de Datos'] },
  { name: 'Finanzas', head: 'Directora Financiera', roles: ['Contador', 'Analista de Tesorería', 'Auxiliar Contable'] },
  { name: 'Gestión Humana', head: 'Directora de Gestión Humana', roles: ['Analista de Nómina', 'Psicóloga de Selección', 'Coordinador de Bienestar'] },
]

// Eficacia: outsourcing comercial (fuerza de ventas, trade, contact center). Andres es la cuenta admin del demo.
const EFICACIA_AREAS: Area[] = [
  { name: 'Fuerza de Ventas', head: 'Directora de Fuerza de Ventas', roles: ['Jefe de Zona', 'Supervisor de Ruta', 'Ejecutivo de Ventas', 'Promotor'], size: 8 },
  { name: 'Trade Marketing', head: 'Director de Trade Marketing', roles: ['Analista de Trade', 'Coordinador de Exhibición', 'Gestor de Punto de Venta'], size: 4 },
  { name: 'Contact Center', head: 'Directora de Contact Center', roles: ['Supervisor de Operación', 'Asesor de Servicio', 'Analista de Calidad', 'Formador'], size: 6 },
  { name: 'Cuentas Clave', head: 'Director de Cuentas', roles: ['Ejecutiva de Cuenta', 'Analista de Servicio al Cliente', 'Coordinador de Implementación'], size: 4 },
  { name: 'Operaciones', head: 'Director de Operaciones en Campo', roles: ['Supervisor de Ruta', 'Ejecutivo de Ventas', 'Promotor', 'Mercaderista'], size: 10 },
  { name: 'Tecnología', head: 'Líder de Tecnología', headRole: 'admin', roles: ['Desarrollador Full Stack', 'Analista de Datos', 'Ingeniero de Soporte', 'Analista QA'], size: 4, person: { firstName: 'Andres', lastName: 'Agudelo', email: 'andres.agudelo@eficacia.com', phone: '', hireDate: '2019-04-08', documentId: '', birthDate: null, salary: 0, eps: '', pension: '' } },
  { name: 'Finanzas', head: 'Directora Financiera', roles: ['Contador', 'Analista de Costos', 'Analista de Tesorería'], size: 3 },
  { name: 'Gestión Humana', head: 'Directora de Gestión Humana', roles: ['Analista de Selección', 'Coordinador de Bienestar', 'Analista de Nómina'], size: 4 },
]

type Company = { id: string; slug: string; name: string; primaryColor: string; tagline: string; domain?: string; teamSize: number; seed: number; ti: number; areas: Area[] }

const COMPANIES: Company[] = [
  { id: 't-andina', slug: 'andina', name: 'Andina Logística', primaryColor: '#0071E3', tagline: 'Moviendo a Colombia', teamSize: 8, seed: 42, ti: 0, areas: AREAS },
  { id: 't-montana', slug: 'cafe-montana', name: 'Café Montaña', primaryColor: '#15803D', tagline: 'Café de origen', teamSize: 4, seed: 49, ti: 1, areas: AREAS },
  { id: 't-eficacia', slug: 'eficacia', name: 'Eficacia', primaryColor: '#1E5DA1', tagline: 'Soluciones comerciales en el punto de venta', domain: 'eficacia.com', teamSize: 4, seed: 56, ti: 2, areas: EFICACIA_AREAS },
]

export const DEMO_TENANTS = COMPANIES.map(({ id, slug, name, primaryColor, tagline }) => ({ id, slug, name, primaryColor, tagline }))

// PRNG determinista para que la semilla sea estable entre reinicios.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function buildDemoData(companies: Company[] = COMPANIES): DemoData {
  const db: DemoData = { employees: [], events: [], requests: [], posts: [], documents: [], onboardings: [], marks: [], reviews: [] }
  for (const company of companies) {
    const t = company
    const ti = company.ti
    const r = rng(company.seed)
    const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
    const domain = company.domain ?? t.slug.replace('-', '') + '.co'
    const areas = company.areas
    let n = 0
    const make = (position: string, department: string, role: Role, managerId?: string, patch?: Partial<Employee>): Employee => {
      n++
      const first = FIRST[(n * 7 + ti * 3) % FIRST.length]
      const last = `${LAST[(n * 5 + ti) % LAST.length]} ${pick(LAST)}`
      const year = 2016 + Math.floor(r() * 11) // incluye ingresos de 2026 para que el headcount crezca
      const e: Employee = {
        id: `${t.slug}-${n}`, tenantId: t.id, firstName: first, lastName: last, position, department, managerId, role,
        email: `${first.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@${domain}`,
        phone: `+57 3${Math.floor(10 + r() * 89)} ${Math.floor(100 + r() * 899)} ${Math.floor(1000 + r() * 8999)}`,
        hireDate: `${year}-${pad(1 + Math.floor(r() * (year === 2026 ? 9 : 12)))}-${pad(1 + Math.floor(r() * 27))}`,
        birthDate: `${1975 + Math.floor(r() * 25)}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 27))}`,
        contractType: r() > 0.8 ? 'Término fijo' : 'Indefinido',
        salary: Math.round((2 + r() * 10) * 1_000_000 / 50_000) * 50_000,
        documentId: String(Math.floor(1_000_000_000 + r() * 99_999_999)),
        eps: pick(EPS), pension: pick(PENSION), takenDays: 0,
        ...patch,
      }
      // Deja un saldo realista de 4 a 20 días disponibles.
      e.takenDays = Math.max(0, Math.floor(accruedDays(e.hireDate, new Date().toISOString().slice(0, 10)) - (4 + r() * 16)))
      db.employees.push(e)
      db.events.push({ employeeId: e.id, date: e.hireDate, kind: 'Ingreso', changes: [['Cargo', '—', e.position], ['Área', '—', department]] })
      return e
    }

    const ceo = make('Gerente General', 'Dirección', 'admin')
    const teamSize = company.teamSize
    for (const area of areas) {
      const head = make(area.head, area.name, area.headRole ?? (area.name === 'Gestión Humana' ? 'hr' : 'leader'), ceo.id, area.person)
      for (let i = 0; i < (area.size ?? teamSize); i++) {
        const e = make(area.roles[i % area.roles.length], area.name, 'employee', head.id)
        if (r() > 0.6) db.events.push({ employeeId: e.id, date: '2026-03-01', kind: 'Ajuste salarial', changes: [['Salario', 'Anterior', 'Actualizado']] })
      }
    }

    // Solicitudes de ejemplo: el equipo de Tecnología tiene pendientes para su líder.
    const tech = db.employees.filter((e) => e.tenantId === t.id && e.department === 'Tecnología')
    const lead = tech.find((e) => e.role !== 'employee')!
    const members = tech.filter((e) => e.role === 'employee')
    const sample: [string, string, number, HrRequest['status']][] = [
      ['2026-11-23', '2026-11-27', 5, 'pending'],
      ['2026-12-21', '2027-01-08', 12, 'pending'],
      ['2026-11-09', '2026-11-13', 5, 'approved'],
      ['2026-10-05', '2026-10-09', 5, 'approved'],
      ['2026-12-14', '2026-12-18', 5, 'rejected'],
    ]
    sample.forEach(([from, to, days, status], i) => {
      const who = members[(i + 1) % members.length]
      db.requests.push({
        id: `${t.slug}-r${i + 1}`, tenantId: t.id, type: 'vacation', title: `Vacaciones ${days} días`, requesterId: who.id,
        payload: { from, to, days }, status, createdAt: `2026-10-${pad(10 + i)}`,
        steps: [{ approverId: lead.id, status: status === 'pending' ? 'pending' : status === 'approved' ? 'approved' : 'rejected', decidedAt: status === 'pending' ? undefined : `2026-10-${pad(12 + i)}` }],
        closedAt: status === 'pending' ? undefined : `2026-10-${pad(12 + i)}`,
      })
    })

    const hr = db.employees.find((e) => e.tenantId === t.id && e.role === 'hr')!
    db.posts.push(
      { id: `${t.slug}-p1`, tenantId: t.id, authorId: hr.id, kind: 'news', date: '2026-10-28', reactions: 34, body: '🎃 Este viernes celebramos Halloween en todas las sedes. Concurso de disfraces por área: el equipo ganador se lleva un desayuno sorpresa.' },
      { id: `${t.slug}-p2`, tenantId: t.id, authorId: lead.id, kind: 'recognition', toId: members[0].id, value: 'Colaboración', date: '2026-10-27', reactions: 21, body: 'Gracias por quedarte a acompañar el despliegue del viernes y documentar todo para el equipo. ¡Un crack!' },
      { id: `${t.slug}-p3`, tenantId: t.id, authorId: ceo.id, kind: 'news', date: '2026-10-24', reactions: 58, body: `Cerramos el tercer trimestre por encima de la meta. Gracias a cada persona de ${t.name} por hacerlo posible. Pronto compartiremos los resultados completos en la reunión general.` },
      { id: `${t.slug}-p4`, tenantId: t.id, authorId: hr.id, kind: 'news', date: '2026-10-20', reactions: 17, body: '📚 Abrimos inscripciones al programa de inglés con 70% de subsidio. Cupos limitados; inscríbete desde Beneficios.' },
    )
    if (t.slug === 'eficacia') {
      const news = db.posts.filter((p) => p.tenantId === t.id)
      news[0].body = 'Temporada alta en canal moderno: confirma tu ruta, el material de exhibición y las metas de la semana antes del lunes.'
      news[1].body = 'El despliegue del fin de semana en punto de venta quedó documentado y el equipo no perdió ni una visita. Gracias por sostener la operación.'
      news[1].value = 'Servicio'
      news[2].body = 'La cobertura de puntos de venta cerró el trimestre por encima de la meta. Gracias a cada persona en campo, en contact center y en las sedes.'
      news[3].body = 'Abrimos la ruta de formación para supervisores de zona. Los cupos son por regional; inscríbete desde Beneficios.'

      const salesLead = db.employees.find((e) => e.tenantId === t.id && e.department === 'Fuerza de Ventas' && e.role === 'leader')!
      const sales = db.employees.filter((e) => e.managerId === salesLead.id)
      const services: { title: string; who: Employee; approver: Employee; status: HrRequest['status']; day: string }[] = [
        { title: 'Actualización de jefe inmediato', who: sales[0], approver: salesLead, status: 'pending', day: '20' },
        { title: 'Asignación de silla para trabajo en casa', who: sales[0], approver: salesLead, status: 'pending', day: '18' },
        { title: 'Beneficio de celular', who: sales[0], approver: hr, status: 'approved', day: '12' },
        { title: 'Anticipo de prima', who: sales[1], approver: hr, status: 'pending', day: '22' },
        { title: 'Retiro de cesantías', who: sales[2], approver: hr, status: 'approved', day: '08' },
        { title: 'Cambio de EPS, pensión y cuenta bancaria', who: sales[1], approver: hr, status: 'pending', day: '25' },
        { title: 'Cambio de plan de línea celular', who: sales[3], approver: hr, status: 'rejected', day: '06' },
      ]
      services.forEach((item, i) => {
        db.requests.push({
          id: `${t.slug}-svc${i + 1}`,
          tenantId: t.id,
          type: 'data_change',
          title: item.title,
          requesterId: item.who.id,
          payload: { note: item.title },
          status: item.status,
          createdAt: `2026-10-${item.day}`,
          steps: [{
            approverId: item.approver.id,
            status: item.status === 'pending' ? 'pending' : item.status === 'approved' ? 'approved' : 'rejected',
            decidedAt: item.status === 'pending' ? undefined : `2026-10-${item.day}`,
          }],
          closedAt: item.status === 'pending' ? undefined : `2026-10-${item.day}`,
        })
      })
    }

    // Nuevos ingresos con onboarding en curso
    const nowIso = new Date().toISOString().slice(0, 10)
    ;[[-12, 6], [-5, 3], [3, 0]].forEach(([offset, done], i) => {
      const area = areas[(i + 1) % areas.length]
      const head = db.employees.find((e) => e.tenantId === t.id && e.department === area.name && e.role !== 'employee')!
      const hire = make(area.roles[0], area.name, 'employee', head.id)
      hire.hireDate = addDays(nowIso, offset); hire.takenDays = 0
      db.events.find((ev) => ev.employeeId === hire.id)!.date = hire.hireDate
      db.onboardings.push(newOnboarding(t.id, hire.id, hire.hireDate, done))
    })

    const all = db.employees.filter((e) => e.tenantId === t.id)
    all.forEach((e, i) => {
      db.documents.push({ id: `${e.id}-d1`, tenantId: t.id, employeeId: e.id, name: `Contrato laboral ${e.contractType.toLowerCase()}`, kind: 'Contrato', status: 'signed', createdAt: e.hireDate, signedAt: e.hireDate })
      db.documents.push({ id: `${e.id}-d2`, tenantId: t.id, employeeId: e.id, name: 'Política de tratamiento de datos 2026', kind: 'Política', status: i % 3 === 0 ? 'signed' : 'pending_signature', createdAt: '2026-10-15', signedAt: i % 3 === 0 ? '2026-10-16' : undefined })
      db.reviews.push({ employeeId: e.id, performance: (1 + Math.floor(r() * 3)) as 1 | 2 | 3, potential: (1 + Math.floor(r() * 3)) as 1 | 2 | 3 })
      // Marcas de asistencia de los últimos 5 días hábiles
      for (let d = 1, n = 0; n < 5; d++) {
        const day = addDays(nowIso, -d)
        if ([0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())) continue
        n++
        const late = r() > 0.85
        db.marks.push({ employeeId: e.id, kind: 'in', at: `${day}T${late ? '08:2' : '07:5'}${Math.floor(r() * 10)}:00` })
        db.marks.push({ employeeId: e.id, kind: 'out', at: `${day}T${r() > 0.8 ? '19' : '17'}:${String(Math.floor(r() * 50) + 10)}:00` })
      }
    })
  }
  return db
}
