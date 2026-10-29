import { format, parseISO, differenceInMonths, differenceInYears, isValid } from "date-fns"
import { es } from "date-fns/locale"

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === "string" ? parseISO(value) : value
  return isValid(d) ? d : null
}

export function formatDate(value: string | Date | null | undefined, pattern = "dd/MM/yyyy"): string {
  const d = toDate(value)
  return d ? format(d, pattern, { locale: es }) : "—"
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "dd/MM/yyyy HH:mm")
}

export function formatLongDate(value: Date = new Date()): string {
  return format(value, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatCOP(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

export function formatDays(value: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)
}

export function fullName(e: { first_name: string; last_name: string } | null | undefined): string {
  return e ? `${e.first_name} ${e.last_name}` : "—"
}

export function initials(e: { first_name: string; last_name: string } | null | undefined): string {
  return e ? `${e.first_name[0] ?? ""}${e.last_name[0] ?? ""}`.toUpperCase() : "?"
}

export function tenure(hireDate: string | null | undefined): string {
  const d = toDate(hireDate)
  if (!d) return "—"
  const years = differenceInYears(new Date(), d)
  const months = differenceInMonths(new Date(), d) % 12
  if (years === 0) return `${months} ${months === 1 ? "mes" : "meses"}`
  return `${years} ${years === 1 ? "año" : "años"}${months ? ` y ${months} ${months === 1 ? "mes" : "meses"}` : ""}`
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  pending_signature: "Pendiente de firma",
  signed: "Firmado",
  in_progress: "En curso",
  completed: "Completado",
}

export const TYPE_LABEL: Record<string, string> = {
  vacation: "Vacaciones",
  permission: "Permiso",
  certificate: "Certificado",
  data_change: "Cambio de datos",
  generic: "General",
}

export const ROLE_LABEL: Record<string, string> = {
  employee: "Empleado",
  leader: "Líder",
  hr: "RR. HH.",
  admin: "Administrador",
}
