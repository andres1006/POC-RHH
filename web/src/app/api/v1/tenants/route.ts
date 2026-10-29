// Directorio público de empresas y registro de una empresa nueva.
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from '@/server/context'
import { listTenants, registerTenant } from '@/server/auth/service'

export async function GET() {
  return NextResponse.json(await listTenants())
}

export async function POST(r: NextRequest) {
  try {
    return NextResponse.json(await registerTenant(await r.json()), { status: 201 })
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status })
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message, issues: e.issues }, { status: 400 })
    throw e
  }
}
