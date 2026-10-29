import { Check, X } from 'lucide-react'
import { decideRequest } from '@/server/actions'

// Un formulario por decisión: el valor viaja en un input oculto, no depende del botón que dispare el submit.
export function DecisionButtons({ tenant, id }: { tenant: string; id: string }) {
  const Form = ({ decision, children, className }: { decision: 'approve' | 'reject'; children: React.ReactNode; className: string }) => (
    <form action={decideRequest}>
      <input type="hidden" name="tenant" value={tenant} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button className={className}>{children}</button>
    </form>
  )
  return (
    <div className="flex gap-2">
      <Form decision="reject" className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-rose-50 hover:text-rose-700">
        <X className="size-3.5" aria-hidden /> Rechazar
      </Form>
      <Form decision="approve" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
        <Check className="size-3.5" aria-hidden /> Aprobar
      </Form>
    </div>
  )
}
