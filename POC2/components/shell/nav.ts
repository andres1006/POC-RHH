import type { LucideIcon } from "lucide-react"
import {
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  Gift,
  Home,
  Inbox,
  Network,
  Rocket,
  ScrollText,
  ShieldCheck,
  Target,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react"
import type { Role } from "@/lib/types"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: Role[]
  soon?: boolean
  module?: string
}

export interface NavGroup {
  label: string
  roles?: Role[]
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Inicio",
    items: [
      { label: "Portal", href: "", icon: Home },
      { label: "Mi ficha", href: "/mi-ficha", icon: UserCircle },
      { label: "Directorio", href: "/directorio", icon: Users },
      { label: "Organigrama", href: "/organigrama", icon: Network },
    ],
  },
  {
    label: "Gestión de RR. HH.",
    items: [
      { label: "Vacaciones y permisos", href: "/vacaciones", icon: CalendarDays, module: "leaves" },
      { label: "Documentos", href: "/documentos", icon: FileText, module: "documents" },
      { label: "Onboarding", href: "/onboarding", icon: Rocket, roles: ["leader", "hr", "admin"], module: "onboarding" },
      { label: "Políticas", href: "/politicas", icon: ScrollText },
      { label: "Nómina", href: "/nomina", icon: Wallet, soon: true, roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Solicitudes", href: "/solicitudes", icon: Inbox },
      { label: "Asistencia y turnos", href: "/asistencia", icon: Clock, module: "attendance" },
    ],
  },
  {
    label: "Talento",
    items: [{ label: "Desempeño", href: "/desempeno", icon: Target, module: "performance" }],
  },
  {
    label: "Cultura",
    items: [
      { label: "Reconocimientos", href: "/reconocimientos", icon: Award, module: "recognitions" },
      { label: "Beneficios", href: "/beneficios", icon: Gift, module: "benefits" },
    ],
  },
  {
    label: "Analítica",
    roles: ["hr", "admin"],
    items: [{ label: "Tablero de indicadores", href: "/indicadores", icon: BarChart3, module: "analytics" }],
  },
  {
    label: "Configuración",
    roles: ["admin"],
    items: [
      { label: "Empresa", href: "/configuracion", icon: Building2 },
      { label: "Roles", href: "/configuracion/roles", icon: ShieldCheck },
    ],
  },
]

export function visibleGroups(role: Role, modules?: Record<string, boolean> | null): NavGroup[] {
  return NAV_GROUPS.filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => (!i.roles || i.roles.includes(role)) && (!i.module || modules?.[i.module] !== false)),
    }))
    .filter((g) => g.items.length > 0)
}
