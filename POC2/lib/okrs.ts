export type OkrLevel = "company" | "department" | "person"
export type KrStatus = "on_track" | "at_risk" | "behind"
export type KrUnit = "%" | "n" | "cop" | "days"

export type KeyResult = {
  id: string
  title: string
  current: number
  target: number
  unit: KrUnit
  direction: "up" | "down"
}

export type OkrObjective = {
  id: string
  title: string
  description: string
  level: OkrLevel
  department?: string
  ownerId?: string
  ownerName?: string
  ownerRole?: string
  period: string
  keyResults: KeyResult[]
}

export type OkrPerson = {
  id: string
  first_name: string
  last_name: string
  position: string | null
  department: string
  manager_id: string | null
}

function seed(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function vary(base: number, name: string, spread = 8) {
  const n = seed(name) % (spread * 2 + 1)
  return Math.max(0, Math.round((base + n - spread) * 10) / 10)
}

export function krProgress(kr: KeyResult) {
  if (kr.direction === "down") {
    if (kr.current <= kr.target) return 100
    if (kr.target === 0) return Math.max(0, 100 - kr.current * 25)
    const worst = Math.max(kr.target * 2.5, kr.current)
    return Math.max(0, Math.min(100, (1 - (kr.current - kr.target) / (worst - kr.target)) * 100))
  }
  if (kr.target <= 0) return kr.current > 0 ? 100 : 0
  return Math.max(0, Math.min(100, (kr.current / kr.target) * 100))
}

export function krStatus(kr: KeyResult): KrStatus {
  const progress = krProgress(kr)
  if (progress >= 75) return "on_track"
  if (progress >= 45) return "at_risk"
  return "behind"
}

export function objectiveProgress(objective: OkrObjective) {
  if (objective.keyResults.length === 0) return 0
  return objective.keyResults.reduce((sum, kr) => sum + krProgress(kr), 0) / objective.keyResults.length
}

export function formatKrValue(value: number, unit: KrUnit) {
  if (unit === "cop") return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0, notation: "compact" }).format(value)
  if (unit === "%") return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)}%`
  if (unit === "days") return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)} d`
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)
}

function areaOf(person: OkrPerson) {
  return person.department || "Sin área"
}

function companyObjectives(tenantName: string): OkrObjective[] {
  return [
    {
      id: "co-growth",
      title: "Crecer con rentabilidad y cobertura",
      description: `Expandir la operación de ${tenantName} sin perder margen.`,
      level: "company",
      ownerName: tenantName,
      ownerRole: "Compañía",
      period: "2026",
      keyResults: [
        { id: "co-g1", title: "Facturación anual (miles de millones)", current: 86, target: 120, unit: "n", direction: "up" },
        { id: "co-g2", title: "Margen EBITDA", current: 11.2, target: 13, unit: "%", direction: "up" },
        { id: "co-g3", title: "Nuevos contratos de fuerza de ventas", current: 18, target: 25, unit: "n", direction: "up" },
      ],
    },
    {
      id: "co-ops",
      title: "Operar con excelencia y seguridad",
      description: "Cumplir el servicio con calidad, puntualidad y cero accidentes graves.",
      level: "company",
      ownerName: tenantName,
      ownerRole: "Compañía",
      period: "2026",
      keyResults: [
        { id: "co-o1", title: "OTIF (entregas a tiempo y completas)", current: 94, target: 98, unit: "%", direction: "up" },
        { id: "co-o2", title: "Accidentes con pérdida de tiempo", current: 3, target: 0, unit: "n", direction: "down" },
        { id: "co-o3", title: "NPS de clientes", current: 62, target: 70, unit: "n", direction: "up" },
      ],
    },
    {
      id: "co-people",
      title: "Ser el mejor lugar para trabajar",
      description: "Retener talento crítico y mejorar la experiencia del colaborador.",
      level: "company",
      ownerName: tenantName,
      ownerRole: "Compañía",
      period: "2026",
      keyResults: [
        { id: "co-p1", title: "eNPS interno", current: 38, target: 50, unit: "n", direction: "up" },
        { id: "co-p2", title: "Rotación voluntaria", current: 14, target: 10, unit: "%", direction: "down" },
        { id: "co-p3", title: "Cobertura de vacantes críticas", current: 82, target: 100, unit: "%", direction: "up" },
      ],
    },
  ]
}

function departmentTemplate(area: string): { title: string; description: string; krs: Omit<KeyResult, "id">[] }[] {
  const key = area.toLowerCase()
  if (key.includes("oper")) {
    return [
      {
        title: "Subir la productividad de ruta",
        description: "Más entregas por colaborador, con menos retrabajo.",
        krs: [
          { title: "Entregas a tiempo", current: 93, target: 97, unit: "%", direction: "up" },
          { title: "Horas extra no planeadas", current: 6.4, target: 4, unit: "n", direction: "down" },
          { title: "Incidentes de seguridad", current: 4, target: 1, unit: "n", direction: "down" },
        ],
      },
    ]
  }
  if (key.includes("comer") || key.includes("venta")) {
    return [
      {
        title: "Acelerar la captación y la recarga",
        description: "Cerrar más cuentas y subir el ticket promedio.",
        krs: [
          { title: "Nuevos clientes activos", current: 14, target: 20, unit: "n", direction: "up" },
          { title: "Cumplimiento de cuota", current: 88, target: 100, unit: "%", direction: "up" },
          { title: "Churn de cuentas clave", current: 7, target: 4, unit: "%", direction: "down" },
        ],
      },
    ]
  }
  if (key.includes("humana") || key.includes("rr") || key.includes("gente")) {
    return [
      {
        title: "Cerrar el ciclo de talento a tiempo",
        description: "Selección, onboarding y clima sin cuellos de botella.",
        krs: [
          { title: "Tiempo de cobertura de vacante", current: 28, target: 21, unit: "days", direction: "down" },
          { title: "Onboardings a tiempo", current: 86, target: 95, unit: "%", direction: "up" },
          { title: "OKRs con check-in del mes", current: 72, target: 100, unit: "%", direction: "up" },
        ],
      },
    ]
  }
  if (key.includes("tecno") || key.includes("sist") || key.includes("digital")) {
    return [
      {
        title: "Estabilizar la plataforma y acortar el time-to-value",
        description: "Menos incidentes y más entregas útiles al negocio.",
        krs: [
          { title: "Uptime de sistemas críticos", current: 99.2, target: 99.7, unit: "%", direction: "up" },
          { title: "Historias liberadas por sprint", current: 18, target: 24, unit: "n", direction: "up" },
          { title: "Tickets P1 abiertos", current: 3, target: 1, unit: "n", direction: "down" },
        ],
      },
    ]
  }
  if (key.includes("finanz") || key.includes("conta")) {
    return [
      {
        title: "Cerrar el mes con control y visibilidad",
        description: "Cierre oportuno y menor desviación presupuestal.",
        krs: [
          { title: "Días para el cierre contable", current: 7, target: 5, unit: "days", direction: "down" },
          { title: "Desviación vs presupuesto", current: 4.8, target: 3, unit: "%", direction: "down" },
          { title: "Facturas conciliadas a tiempo", current: 91, target: 98, unit: "%", direction: "up" },
        ],
      },
    ]
  }
  return [
    {
      title: `Mejorar los resultados de ${area}`,
      description: "Avance medible del área en el ciclo anual.",
      krs: [
        { title: "Cumplimiento del plan del área", current: 78, target: 100, unit: "%", direction: "up" },
        { title: "Iniciativas cerradas", current: 6, target: 10, unit: "n", direction: "up" },
        { title: "Retrasos críticos", current: 2, target: 0, unit: "n", direction: "down" },
      ],
    },
  ]
}

function personTemplate(person: OkrPerson): { title: string; description: string; krs: Omit<KeyResult, "id">[] } {
  const area = areaOf(person)
  const role = (person.position ?? "").toLowerCase()
  const name = `${person.first_name} ${person.last_name}`
  if (role.includes("gerente") || role.includes("director") || role.includes("líder") || role.includes("lider")) {
    return {
      title: `Llevar a ${area} al plan 2026`,
      description: "Resultados del equipo, no solo de la persona.",
      krs: [
        { title: "Avance de OKRs del equipo", current: vary(74, name), target: 100, unit: "%", direction: "up" },
        { title: "1:1s cumplidos en el mes", current: vary(85, name + "1"), target: 100, unit: "%", direction: "up" },
        { title: "Personas en riesgo sin plan", current: vary(2, name, 2), target: 0, unit: "n", direction: "down" },
      ],
    }
  }
  if (role.includes("comercial") || role.includes("asesor") || role.includes("cuenta") || role.includes("ventas")) {
    return {
      title: "Cumplir la cuota y cuidar la cartera",
      description: "Ventas nuevas y retención de cuentas asignadas.",
      krs: [
        { title: "Cumplimiento de cuota", current: vary(82, name), target: 100, unit: "%", direction: "up" },
        { title: "Visitas efectivas / semana", current: vary(9, name, 3), target: 12, unit: "n", direction: "up" },
        { title: "Cuentas en riesgo", current: vary(2, name, 2), target: 0, unit: "n", direction: "down" },
      ],
    }
  }
  return {
    title: `Aportar al objetivo de ${area}`,
    description: "Key results individuales alineados al área.",
    krs: [
      { title: "Entregables del ciclo a tiempo", current: vary(81, name), target: 100, unit: "%", direction: "up" },
      { title: "Tareas críticas cerradas", current: vary(14, name, 4), target: 18, unit: "n", direction: "up" },
      { title: "Retrabajos del mes", current: vary(2, name, 2), target: 0, unit: "n", direction: "down" },
    ],
  }
}

export function buildOkrs(input: { tenantName: string; people: OkrPerson[] }) {
  const company = companyObjectives(input.tenantName)
  const areas = [...new Set(input.people.map(areaOf))].sort((a, b) => a.localeCompare(b, "es"))
  const departments = areas.map((area) => ({
    name: area,
    objectives: departmentTemplate(area).map((item, index) => ({
      id: `dep-${area}-${index}`,
      title: item.title,
      description: item.description,
      level: "department" as const,
      department: area,
      ownerName: area,
      ownerRole: "Departamento",
      period: "2026",
      keyResults: item.krs.map((kr, krIndex) => ({ ...kr, id: `dep-${area}-${index}-${krIndex}`, current: vary(kr.current, area + kr.title, kr.unit === "%" ? 6 : 2) })),
    })),
  }))
  const people = input.people.map((person) => {
    const draft = personTemplate(person)
    const objective: OkrObjective = {
      id: `per-${person.id}`,
      title: draft.title,
      description: draft.description,
      level: "person",
      department: areaOf(person),
      ownerId: person.id,
      ownerName: `${person.first_name} ${person.last_name}`,
      ownerRole: person.position ?? "Colaborador",
      period: "2026",
      keyResults: draft.krs.map((kr, index) => ({ ...kr, id: `per-${person.id}-${index}` })),
    }
    return { person, objectives: [objective] }
  })
  return { company, departments, people }
}

export const KR_STATUS_LABEL: Record<KrStatus, string> = {
  on_track: "En curso",
  at_risk: "En riesgo",
  behind: "Atrasado",
}
