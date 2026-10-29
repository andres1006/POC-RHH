'use client'
import { ActionForm, Field } from '@/platform/action-form'
import { requestService } from '@/server/actions'
import { field } from '@/platform/ui'
import type { ServiceItem } from './catalog'

export function CatalogCreateForm({ tenant, service }: { tenant: string; service: ServiceItem }) {
  return (
    <ActionForm action={requestService} tenant={tenant} submit="Enviar solicitud" success="Solicitud enviada" hidden={{ service: service.id }}>
      {service.options && (
        <Field label="Tipo de trámite">
          <select name="option" required className={field} defaultValue="">
            <option value="" disabled>Elige una opción</option>
            {service.options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        </Field>
      )}
      <Field label="Comentario (opcional)">
        <textarea name="note" maxLength={500} rows={3} placeholder="Cuéntanos el detalle de tu solicitud…" className={field} />
      </Field>
    </ActionForm>
  )
}
