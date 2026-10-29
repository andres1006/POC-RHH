/** Marca visible de la demo Andina → Eficacia. El slug en Supabase sigue siendo andina. */
export const PRODUCT_NAME = "Eficacia RH"

export function brandedTenant<T extends { slug: string; name: string; logo_url?: string | null; primary_color?: string }>(tenant: T): T {
  if (tenant.slug !== "andina") return tenant
  return {
    ...tenant,
    name: "Eficacia",
    logo_url: "/logos/eficacia.png",
    primary_color: "#1E5DA1",
  }
}
