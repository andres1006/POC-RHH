"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import type { RequestRow } from "@/lib/types"
import { cancelRequest, decideRequest } from "@/lib/actions"
import { formatDate, formatDateTime, fullName, TYPE_LABEL } from "@/lib/format"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonCell } from "@/components/shared/employee-avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const PAYLOAD_LABEL: Record<string, string> = {
  start_date: "Inicio",
  end_date: "Fin",
  days: "Días hábiles",
  comment: "Comentario",
  type: "Tipo",
  date: "Fecha",
  hours: "Horas",
  note: "Nota",
  half_day: "Media jornada",
  attachment: "Soporte",
  changes: "Cambios",
  template_id: "Plantilla",
}

function renderValue(key: string, value: unknown) {
  if (key.endsWith("_date") || key === "date") return formatDate(String(value))
  if (typeof value === "object" && value) return JSON.stringify(value)
  if (typeof value === "boolean") return value ? "Sí" : "No"
  return String(value)
}

export function RequestDetailSheet({ request, onOpenChange, slug, currentEmployeeId, canDecide }: { request: RequestRow | null; onOpenChange: (o: boolean) => void; slug: string; currentEmployeeId: string; canDecide: boolean }) {
  const [comment, setComment] = useState("")
  const [pending, startTransition] = useTransition()
  if (!request) return <Sheet open={false} onOpenChange={onOpenChange} />

  const myStep = request.steps?.find((s) => s.status === "pending" && s.approver_id === currentEmployeeId)
  const showDecide = request.status === "pending" && (myStep || canDecide)
  const isMine = request.requester_id === currentEmployeeId

  const decide = (decision: "approved" | "rejected") =>
    startTransition(async () => {
      if (decision === "rejected" && !comment.trim()) {
        toast.error("Indica el motivo del rechazo.")
        return
      }
      const res = await decideRequest(slug, request.id, decision, comment)
      if (res.ok) {
        toast.success(res.message)
        onOpenChange(false)
        setComment("")
      } else toast.error(res.error)
    })

  return (
    <Sheet open={!!request} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-base">{request.title}</SheetTitle>
            <StatusBadge status={request.status} />
          </div>
          <SheetDescription>
            #{request.id.slice(0, 6)} · {TYPE_LABEL[request.type_key] ?? request.type_key} · creada el {formatDate(request.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-5 py-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitante</h3>
            <PersonCell person={request.requester} subtitle={request.requester?.department?.name} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos</h3>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              {Object.entries(request.payload ?? {}).map(([k, v]) => (
                <div key={k} className={k === "comment" || k === "changes" ? "col-span-2" : ""}>
                  <dt className="text-xs text-muted-foreground">{PAYLOAD_LABEL[k] ?? k}</dt>
                  <dd className="font-medium break-words">{renderValue(k, v)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aprobaciones</h3>
            <ol className="relative flex flex-col gap-4 border-l pl-5">
              <li className="relative text-sm">
                <span className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-background bg-success" aria-hidden />
                <p className="font-medium">Solicitud creada</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(request.created_at)}</p>
              </li>
              {(request.steps ?? [])
                .sort((a, b) => a.step - b.step)
                .map((s) => (
                  <li key={s.id} className="relative text-sm">
                    <span className={`absolute -left-[26px] top-1 size-3 rounded-full border-2 border-background ${s.status === "approved" ? "bg-success" : s.status === "rejected" ? "bg-destructive" : "bg-warning"}`} aria-hidden />
                    <p className="font-medium">
                      Paso {s.step}: {fullName(s.approver)} <StatusBadge status={s.status} className="ml-1" />
                    </p>
                    <p className="text-xs text-muted-foreground">{s.decided_at ? formatDateTime(s.decided_at) : "En espera de decisión"}</p>
                    {s.comment && <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs">“{s.comment}”</p>}
                  </li>
                ))}
            </ol>
          </section>

          {showDecide && (
            <section className="flex flex-col gap-3 rounded-xl border p-4">
              <Label htmlFor="decision-comment">Comentario (obligatorio al rechazar)</Label>
              <Textarea id="decision-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Agrega contexto para el solicitante" />
              <div className="flex gap-2">
                <Button onClick={() => decide("approved")} disabled={pending} className="flex-1">
                  <Check /> Aprobar
                </Button>
                <Button onClick={() => decide("rejected")} disabled={pending} variant="destructive" className="flex-1">
                  <X /> Rechazar
                </Button>
              </div>
            </section>
          )}

          {isMine && request.status === "pending" && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await cancelRequest(slug, request.id)
                  if (res.ok) {
                    toast.success(res.message)
                    onOpenChange(false)
                  } else toast.error(res.error)
                })
              }
            >
              Cancelar mi solicitud
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
