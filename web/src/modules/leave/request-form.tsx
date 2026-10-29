'use client'
import { startTransition, useActionState, useEffect, useState } from 'react'
import { businessDays } from './domain'
import { requestVacation, type ActionState } from '@/server/actions'
import { btn, field } from '@/platform/ui'

export function VacationForm({ tenant, available, minDate }: { tenant: string; available: number; minDate: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestVacation, {})
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => { if (state.ok) { setFrom(''); setTo('') } }, [state])
  const days = businessDays(from, to)
  const over = days > available

  return (
    <form action={action} onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)) }} className="space-y-4">
      <input type="hidden" name="tenant" value={tenant} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Desde</span>
          <input type="date" name="from" required min={minDate} value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Hasta</span>
          <input type="date" name="to" required min={from || minDate} value={to} onChange={(e) => setTo(e.target.value)} className={field} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Comentario (opcional)</span>
        <textarea name="note" rows={2} maxLength={500} className={field} />
      </label>
      <p aria-live="polite" className={`rounded-lg px-3 py-2 text-sm ${over ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-primary/5 text-primary'}`}>
        {days > 0 ? <>Estás solicitando <b>{days}</b> día{days > 1 ? 's' : ''} hábil{days > 1 ? 'es' : ''}{over && ` · solo tienes ${available}`}</> : 'Elige las fechas: se descuentan fines de semana y festivos de Colombia'}
      </p>
      {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-600">✓ Solicitud enviada a tu líder para aprobación</p>}
      <button disabled={pending || days === 0 || over} className={btn.primary}>{pending ? 'Enviando…' : 'Solicitar vacaciones'}</button>
    </form>
  )
}
