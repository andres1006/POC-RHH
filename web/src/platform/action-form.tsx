'use client'
import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import type { ActionState } from '@/server/actions'
import { btn, cx } from './ui'

/** Formulario con Server Action + mensajes de error/éxito accesibles.
 *  Se envía con onSubmit (no `action`) para que React no limpie los campos cuando hay error; solo se limpia al terminar bien. */
export function ActionForm({
  action, tenant, submit, success, children, className, hidden,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>
  tenant: string
  submit: string
  success: string
  children: ReactNode
  className?: string
  hidden?: Record<string, string>
}) {
  const [state, run, pending] = useActionState(action, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => { if (state.ok) ref.current?.reset() }, [state])
  return (
    // `action` cubre el envío antes de hidratar (POST de Server Action, nunca GET con datos en la URL)
    <form ref={ref} action={run} onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => run(data)) }} className={cx('space-y-4', className)}>
      <input type="hidden" name="tenant" value={tenant} />
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-600">✓ {success}</p>}
      <button disabled={pending} className={btn.primary}>{pending ? 'Enviando…' : submit}</button>
    </form>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  )
}
