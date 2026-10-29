'use client'
import { useActionState } from 'react'
import { KeyRound } from 'lucide-react'
import { grantAccess, revokeAccess, type ActionState } from '@/server/actions'
import { Badge, btn } from '@/platform/ui'

/**
 * Celda de acceso de una persona. Es un solo componente en la misma posición del árbol para que,
 * al refrescarse la fila tras dar acceso, conserve el estado y la clave temporal siga visible.
 */
export function AccessCell({ tenant, employee, hasAccess, mustChange, self }: { tenant: string; employee: string; hasAccess: boolean; mustChange: boolean; self: boolean }) {
  const [state, run, pending] = useActionState<ActionState, FormData>(grantAccess, {})
  if (state.ok && state.data) {
    return (
      <span className="block rounded-lg bg-emerald-50 px-2 py-1 text-left text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" role="status">
        Clave temporal (cópiala ahora): <code className="select-all font-semibold">{state.data.password}</code>
      </span>
    )
  }
  if (hasAccess) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge tone={mustChange ? 'warning' : 'success'}>{mustChange ? 'Clave temporal' : 'Con acceso'}</Badge>
        {!self && (
          <form action={revokeAccess} className="inline">
            <input type="hidden" name="tenant" value={tenant} />
            <input type="hidden" name="employee" value={employee} />
            <button className="text-xs text-muted hover:text-rose-600">Quitar</button>
          </form>
        )}
      </span>
    )
  }
  return (
    <form action={run} className="inline-flex items-center gap-2">
      <input type="hidden" name="tenant" value={tenant} />
      <input type="hidden" name="employee" value={employee} />
      <button disabled={pending} className={btn.tinted}><KeyRound className="size-3.5" aria-hidden /> {pending ? 'Creando…' : 'Dar acceso'}</button>
      {state.error && <span role="alert" className="text-xs text-rose-600">{state.error}</span>}
    </form>
  )
}
