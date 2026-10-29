import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROOT = ['', 'registro', 'api', '_next']

// 1) Resuelve el tenant por subdominio: andina.localhost:3000/vacaciones → /andina/vacaciones
//    (sin subdominio se usa la ruta directa /andina/...).
// 2) Sin cookie de sesión de esa empresa → al login (la validación real de la sesión la hace el layout).
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const sub = host.split(':')[0].split('.')
  const subSlug = sub.length > (host.includes('localhost') ? 1 : 2) && sub[0] !== 'www' ? sub[0] : null
  let { pathname } = req.nextUrl
  const rewrite = subSlug && !pathname.startsWith(`/${subSlug}`) && !pathname.startsWith('/api')
  if (rewrite) pathname = `/${subSlug}${pathname === '/' ? '' : pathname}`

  const [, slug = '', section = ''] = pathname.split('/')
  if (slug && !PUBLIC_ROOT.includes(slug) && section !== 'login' && !req.cookies.has(`rh_session_${slug}`)) {
    return NextResponse.redirect(new URL(`/${slug}/login`, req.url))
  }

  if (rewrite) {
    const url = req.nextUrl.clone()
    url.pathname = pathname
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'] }
