'use client'
import { useState } from 'react'
import { ActionForm, Field } from '@/platform/action-form'
import { field } from '@/platform/ui'
import { updateBrand } from '@/server/actions'

// Contraste del texto blanco sobre el color elegido (WCAG): el botón primario debe pasar 4.5:1.
function contrastWithWhite(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  return 1.05 / (L + 0.05)
}

export function BrandForm({ tenant, name, color }: { tenant: string; name: string; color: string }) {
  const [n, setN] = useState(name)
  const [c, setC] = useState(color)
  const ratio = contrastWithWhite(c)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ActionForm action={updateBrand} tenant={tenant} submit="Guardar marca" success="Marca actualizada en toda la plataforma">
        <Field label="Nombre visible"><input name="name" value={n} onChange={(e) => setN(e.target.value)} required maxLength={40} className={field} /></Field>
        <Field label="Color principal">
          <span className="flex items-center gap-3">
            <input type="color" name="color" value={c} onChange={(e) => setC(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent" />
            <code className="text-sm text-muted">{c.toUpperCase()}</code>
          </span>
        </Field>
        <p className={`text-xs ${ratio >= 4.5 ? 'text-emerald-600' : 'text-rose-600'}`}>
          Contraste con texto blanco: {ratio.toFixed(1)}:1 {ratio >= 4.5 ? '✓ cumple AA' : '— elige un tono más oscuro para cumplir AA'}
        </p>
      </ActionForm>
      <div className="rounded-2xl bg-bg p-4" style={{ '--primary': c } as React.CSSProperties} aria-label="Vista previa">
        <p className="mb-3 text-xs font-medium text-muted">Vista previa</p>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-primary text-sm font-bold text-white">{n[0] ?? '?'}</span>
          <span className="font-semibold">{n}</span>
        </div>
        <div className="mt-4 rounded-[8px] bg-primary px-2 py-1.5 text-sm text-white">Portal</div>
        <button type="button" className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white">Solicitar vacaciones</button>
      </div>
    </div>
  )
}
