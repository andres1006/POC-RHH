export const SERVICE_CATEGORIES = [
  'Todas',
  'Comunicaciones Móviles',
  'Cultura de consecuencias',
  'Flujos movistar',
  'Gestión Humana',
  'Recursos del servicio',
  'Servicios administrativos',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]
export type ServiceVariant = 'light' | 'navy' | 'muted'
export type ServiceOption = { id: string; title: string }

export type ServiceItem = {
  id: string
  title: string
  subtitle: string
  description: string
  category: Exclude<ServiceCategory, 'Todas'>
  variant: ServiceVariant
  photo: string
  approver: 'manager' | 'hr'
  requestTitle?: string
  options?: ServiceOption[]
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'jefe',
    title: 'Jefe inmediato',
    subtitle: 'Actualización líder / aprobador',
    description: 'Actualiza tu líder o el aprobador de tus trámites.',
    category: 'Gestión Humana',
    variant: 'light',
    photo: '/services/jefe.jpg',
    approver: 'hr',
    requestTitle: 'Actualización de jefe inmediato',
  },
  {
    id: 'prima-cesantias',
    title: 'Prima - Cesantías',
    subtitle: 'Anticipo prima / Retiro cesantías',
    description: 'Solicita un anticipo de prima o el retiro de cesantías.',
    category: 'Gestión Humana',
    variant: 'light',
    photo: '/services/prima-cesantias.jpg',
    approver: 'hr',
    options: [
      { id: 'anticipo-prima', title: 'Anticipo de prima' },
      { id: 'retiro-cesantias', title: 'Retiro de cesantías' },
    ],
  },
  {
    id: 'silla',
    title: 'Asignación de Silla',
    subtitle: 'Asignación de sillas',
    description: 'Asignación de sillas para colaboradores en modalidad autónoma (trabajo en casa).',
    category: 'Recursos del servicio',
    variant: 'navy',
    photo: '/services/silla.jpg',
    approver: 'manager',
    requestTitle: 'Asignación de silla para trabajo en casa',
  },
  {
    id: 'beneficio-celular',
    title: 'Beneficio celular',
    subtitle: 'Beneficio equipo y línea',
    description: 'Solicita el beneficio de equipo y línea celular.',
    category: 'Comunicaciones Móviles',
    variant: 'muted',
    photo: '/services/beneficio-celular.jpg',
    approver: 'hr',
    requestTitle: 'Beneficio de celular',
  },
  {
    id: 'eps-pension',
    title: 'Eps - Pensión - Cesantías - Banco',
    subtitle: 'Cambio de cuenta y entidades',
    description: 'Cambio de EPS, fondo de pensión, cesantías y cuenta bancaria.',
    category: 'Gestión Humana',
    variant: 'light',
    photo: '/services/eps-pension.jpg',
    approver: 'hr',
    requestTitle: 'Cambio de EPS, pensión y cuenta bancaria',
  },
  {
    id: 'plan-celular',
    title: 'Cambio de plan Línea celular',
    subtitle: 'Cambio de plan',
    description: 'Cambia el plan de tu línea celular corporativa.',
    category: 'Comunicaciones Móviles',
    variant: 'navy',
    photo: '/services/plan-celular.jpg',
    approver: 'hr',
    requestTitle: 'Cambio de plan de línea celular',
  },
]

export function findService(id: string) {
  return SERVICES.find((s) => s.id === id)
}

export function resolveServiceTitle(id: string, option?: string) {
  const service = findService(id)
  if (!service) return
  if (option) return service.options?.find((o) => o.id === option)?.title
  if (service.options) return
  return service.requestTitle ?? service.title
}

export function serviceTitles(s: ServiceItem) {
  return [s.requestTitle, s.title, ...(s.options?.map((o) => o.title) ?? [])].filter(Boolean) as string[]
}

export function matchesService(r: { title: string; payload?: { kind?: string } }, s: ServiceItem) {
  return r.payload?.kind === s.id || serviceTitles(s).includes(r.title)
}
