'use client'
import { useState } from 'react'
import { ActionForm, Field } from '@/platform/action-form'
import { field, cx } from '@/platform/ui'
import { requestPermission } from '@/server/actions'
import { PERMISSION_KINDS } from '@/modules/requests/domain'

export function PermissionForm({ tenant, minDate }: { tenant: string; minDate: string }) {
  const [byHour, setByHour] = useState(false)
  return (
    <ActionForm action={requestPermission} tenant={tenant} submit="Solicitar permiso" success="Permiso enviado a tu líder">
      <Field label="Tipo de permiso">
        <select name="kind" required className={field}>{PERMISSION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
      </Field>
      <div className="inline-flex rounded-[9px] bg-fill p-0.5" role="radiogroup" aria-label="Duración">
        {[[false, 'Día completo'], [true, 'Por horas']].map(([v, l]) => (
          <button key={String(v)} type="button" role="radio" aria-checked={byHour === v} onClick={() => setByHour(v as boolean)}
            className={cx('rounded-[7px] px-3.5 py-1 text-[13px] font-medium', byHour === v ? 'bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-muted')}>{l as string}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fecha"><input type="date" name="from" required min={minDate} className={field} /></Field>
        {byHour && <Field label="Horas"><input type="number" name="hours" min={1} max={8} defaultValue={2} className={field} /></Field>}
      </div>
      <Field label="Comentario (opcional)"><textarea name="note" rows={2} maxLength={500} className={field} /></Field>
    </ActionForm>
  )
}
