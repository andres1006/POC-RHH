import { fullName } from '@/platform/format'
import { Avatar, Badge, Empty, STATUS, fmtDate } from '@/platform/ui'
import { isAwaiting, type HrRequest } from './domain'
import { DecisionButtons } from './decision-buttons'

export function requestDetail(r: HrRequest) {
  if (r.type === 'vacation') return `${r.payload.days} días · ${fmtDate(r.payload.from!)} → ${fmtDate(r.payload.to!)}`
  if (r.type === 'permission') return `${r.title} · ${fmtDate(r.payload.from!)}`
  if (r.payload.changes) return `Teléfono → ${r.payload.changes.phone}`
  return r.title
}

export function RequestTable({
  tenant, me, rows, people,
}: {
  tenant: string
  me: string
  rows: HrRequest[]
  people: Map<string, { firstName: string; lastName: string }>
}) {
  if (rows.length === 0) return <Empty title="No hay solicitudes en esta vista" text="Crea una nueva con el formulario o cambia de pestaña" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-medium">Solicitante</th>
            <th className="px-4 py-3 font-medium">Detalle</th>
            <th className="px-4 py-3 font-medium">Creada</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const who = people.get(r.requesterId)
            return (
              <tr key={r.id}>
                <td className="px-4 py-3"><span className="flex items-center gap-2">{who && <Avatar name={fullName(who)} size={28} />}<span className="whitespace-nowrap">{who ? fullName(who) : '—'}</span></span></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{requestDetail(r)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-3"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                <td className="px-4 py-3">{isAwaiting(r, me) && <DecisionButtons tenant={tenant} id={r.id} />}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
