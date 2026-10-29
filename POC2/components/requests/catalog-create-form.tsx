"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createRequest } from "@/lib/actions"
import { resolveServiceTitle, type ServiceItem } from "@/lib/catalog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CatalogCreateForm({ slug, service }: { slug: string; service: ServiceItem }) {
  const router = useRouter()
  const [option, setOption] = useState("")
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => {
      if (service.options && !option) {
        toast.error("Elige un tipo de trámite.")
        return
      }
      const title = resolveServiceTitle(service.id, option || undefined) ?? service.title
      const res = await createRequest(slug, {
        type_key: "data_change",
        title,
        payload: { kind: service.id, option: option || undefined, note },
        flow: service.approver === "hr" ? "hr" : "leader",
      })
      if (res.ok) {
        toast.success(res.message)
        setNote("")
        setOption("")
        router.refresh()
      } else toast.error(res.error)
    })

  return (
    <div className="flex flex-col gap-4">
      {service.options && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-option">Tipo de trámite</Label>
          <select
            id="service-option"
            required
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Elige una opción
            </option>
            {service.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-note">Comentario (opcional)</Label>
        <Textarea
          id="service-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Cuéntanos el detalle de tu solicitud…"
        />
      </div>
      <Button onClick={submit} disabled={pending}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </div>
  )
}
