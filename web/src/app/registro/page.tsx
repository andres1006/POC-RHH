'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ActionForm, Field } from '@/platform/action-form'
import { field } from '@/platform/ui'
import { registerAction } from '@/server/actions'

const toSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)

export default function Registro() {
  const [company, setCompany] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)
  const shown = touched ? slug : toSlug(company)

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <Link href="/" className="text-sm text-primary">← Volver</Link>
      <h1 className="mt-4 text-[32px] font-bold leading-tight">Registra tu empresa</h1>
      <p className="mt-2 text-muted">Crea el espacio de tu empresa y tu cuenta de administrador. Después podrás invitar a tu equipo.</p>
      <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <ActionForm action={registerAction} tenant="" submit="Crear empresa" success="Empresa creada">
          <Field label="Nombre de la empresa"><input name="companyName" required value={company} onChange={(e) => setCompany(e.target.value)} className={field} autoComplete="organization" /></Field>
          <Field label="Dirección web">
            <span className="flex items-center gap-1">
              <input name="slug" required value={shown} onChange={(e) => { setTouched(true); setSlug(toSlug(e.target.value)) }} className={field} aria-describedby="slug-hint" />
              <span className="shrink-0 text-sm text-muted">.nexorh.co</span>
            </span>
            <span id="slug-hint" className="mt-1 block text-xs text-muted">Minúsculas, números y guiones.</span>
          </Field>
          <Field label="Color de la marca"><input type="color" name="primaryColor" defaultValue="#0071E3" className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tus nombres"><input name="firstName" required className={field} autoComplete="given-name" /></Field>
            <Field label="Tus apellidos"><input name="lastName" required className={field} autoComplete="family-name" /></Field>
          </div>
          <Field label="Tu cargo"><input name="position" defaultValue="Gerente General" required className={field} /></Field>
          <Field label="Correo"><input type="email" name="email" required className={field} autoComplete="email" /></Field>
          <Field label="Contraseña (mínimo 8 caracteres)"><input type="password" name="password" required minLength={8} className={field} autoComplete="new-password" /></Field>
        </ActionForm>
      </section>
    </main>
  )
}
