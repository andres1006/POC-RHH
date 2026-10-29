export type Role = 'employee' | 'leader' | 'hr' | 'admin'

export type Permission =
  | 'requests.approve'
  | 'requests.view_all'
  | 'people.read_sensitive'
  | 'people.read_all'
  | 'feed.publish'
  | 'analytics.view'
  | 'tenant.configure'

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Empleado',
  leader: 'Líder',
  hr: 'RR. HH.',
  admin: 'Administrador',
}

// shortcut: mapa estático; en fase 2 pasa a tabla `role_permissions` configurable por tenant.
const GRANTS: Record<Role, Permission[]> = {
  employee: [],
  leader: ['requests.approve'],
  hr: ['requests.approve', 'requests.view_all', 'people.read_sensitive', 'people.read_all', 'feed.publish', 'analytics.view'],
  admin: ['requests.approve', 'requests.view_all', 'people.read_sensitive', 'people.read_all', 'feed.publish', 'analytics.view', 'tenant.configure'],
}

export const can = (role: Role, p: Permission) => GRANTS[role].includes(p)

export type NavItem = { href: string; label: string; icon: string; group: string; perm?: Permission }

export const NAV: NavItem[] = [
  { href: '', label: 'Portal', icon: 'Home', group: 'Inicio' },
  { href: '/perfil', label: 'Mi ficha', icon: 'UserRound', group: 'Inicio' },
  { href: '/directorio', label: 'Directorio', icon: 'Users', group: 'Inicio' },
  { href: '/organigrama', label: 'Organigrama', icon: 'Network', group: 'Inicio' },
  { href: '/vacaciones', label: 'Vacaciones y permisos', icon: 'Palmtree', group: 'Gestión de RR. HH.' },
  { href: '/documentos', label: 'Documentos', icon: 'FileSignature', group: 'Gestión de RR. HH.' },
  { href: '/onboarding', label: 'Onboarding', icon: 'ListChecks', group: 'Gestión de RR. HH.' },
  { href: '/solicitudes', label: 'Solicitudes', icon: 'Workflow', group: 'Operaciones' },
  { href: '/asistencia', label: 'Asistencia y turnos', icon: 'AlarmClock', group: 'Operaciones' },
  { href: '/desempeno', label: 'Desempeño', icon: 'Grid3x3', group: 'Talento' },
  { href: '/reconocimientos', label: 'Reconocimientos', icon: 'Award', group: 'Cultura' },
  { href: '/beneficios', label: 'Beneficios', icon: 'Gift', group: 'Cultura' },
  { href: '/indicadores', label: 'Indicadores', icon: 'ChartColumn', group: 'Analítica', perm: 'analytics.view' },
  { href: '/configuracion', label: 'Configuración', icon: 'Settings', group: 'Administración', perm: 'tenant.configure' },
]

export const navFor = (role: Role) => NAV.filter((n) => !n.perm || can(role, n.perm))
