import type { Role } from "./types"

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false"
export const DEMO_SIGN_CODE = "123456"

export const DEMO_TENANTS = [
  { slug: "andina", name: "Eficacia", color: "#1E5DA1" },
  { slug: "cafe", name: "Café Montaña", color: "#16A34A" },
] as const

export const DEMO_ROLES: Role[] = ["employee", "leader", "hr", "admin"]

export function demoEmail(slug: string, role: Role) {
  return `${role}.${slug}@nexorh.app`
}
