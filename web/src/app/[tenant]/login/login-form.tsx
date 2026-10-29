'use client'
import { useRef } from 'react'
import { ActionForm, Field } from '@/platform/action-form'
import { ROLE_LABEL, type Role } from '@/platform/rbac'
import { field } from '@/platform/ui'
import { loginAction } from '@/server/actions'

// Contraseña de las cuentas demo sembradas (solo datos de prueba; ver scripts/seed.ts).
const DEMO_PASSWORD = 'Demo1234!'
const ORDER: Role[] = ['employee', 'leader', 'hr', 'admin']

export function LoginForm({ tenant, demo }: { tenant: string; demo: { email: string; role: Role; name: string }[] }) {
  const box = useRef<HTMLDivElement>(null)
  const fill = (email: string) => {
    const form = box.current?.querySelector('form')
    if (!form) return
    ;(form.elements.namedItem('email') as HTMLInputElement).value = email
    ;(form.elements.namedItem('password') as HTMLInputElement).value = DEMO_PASSWORD
    form.requestSubmit()
  }
  return (
    <div ref={box}>
      <ActionForm action={loginAction} tenant={tenant} submit="Ingresar" success="Ingresando…">
        <Field label="Correo"><input type="email" name="email" required autoComplete="username" className={field} /></Field>
        <Field label="Contraseña"><input type="password" name="password" required autoComplete="current-password" className={field} /></Field>
      </ActionForm>
      {demo.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-xs font-medium text-muted">Cuentas demo · entra con un clic</p>
          <div className="grid grid-cols-2 gap-2">
            {[...demo].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role)).map((d) => (
              <button key={d.email} type="button" onClick={() => fill(d.email)} className="rounded-xl bg-fill px-3 py-2 text-left text-sm hover:brightness-95">
                <span className="block font-medium">{ROLE_LABEL[d.role]}</span>
                <span className="block truncate text-xs text-muted">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
