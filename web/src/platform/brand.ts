/** Logos estáticos por empresa demo. El color vive en el tenant. */
export type TenantBrand = { logo: string; logoOnDark: string }

const LOGOS: Record<string, TenantBrand> = {
  eficacia: { logo: '/brands/eficacia.png', logoOnDark: '/brands/eficacia-on-dark.png' },
}

export function tenantBrand(slug: string) {
  return LOGOS[slug]
}

export function tenantLogo(slug: string) {
  return LOGOS[slug]?.logo
}
