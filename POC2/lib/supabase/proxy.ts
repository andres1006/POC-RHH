import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

const RESERVED_SUBDOMAINS = new Set(["www", "app"])

// Subdomain tenancy only activates for a configured root domain (e.g. ROOT_DOMAIN=app.com → acme.app.com).
// Preview hosts (v0, Vercel) fall back to the /t/[tenant] route.
function tenantFromHost(host: string | null): string | null {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (!host || !root) return null
  const hostname = host.split(":")[0]
  if (!hostname.endsWith(`.${root}`)) return null
  const sub = hostname.slice(0, -(root.length + 1))
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null
  return sub
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/andina" || pathname.startsWith("/andina/") || pathname === "/eficacia" || pathname.startsWith("/eficacia/")) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/(andina|eficacia)/, "/t/andina")
    return NextResponse.redirect(url)
  }

  // Subdomain tenancy (acme.app.com) rewrites to the /t/[tenant] fallback route.
  const subdomainTenant = tenantFromHost(request.headers.get("host"))
  if (subdomainTenant && !pathname.startsWith("/t/") && !pathname.startsWith("/auth") && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone()
    url.pathname = `/t/${subdomainTenant}${pathname === "/" ? "" : pathname}`
    return NextResponse.rewrite(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return supabaseResponse
  }

  if (pathname.startsWith("/t/") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
