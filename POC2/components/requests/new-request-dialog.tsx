"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Clock, FileText, Inbox, Palmtree, Plus, UserPen, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { createRequest } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CATALOG: { key: string; name: string; description: string; icon: LucideIcon; href?: string }[] = [
  { key: "vacation", name: "Vacaciones", description: "Días hábiles con cálculo automático", icon: Palmtree, href: "/vacaciones?nuevo=1" },
  { key: "permission", name: "Permiso", description: "Remunerado, cita médica, día de la familia…", icon: Clock, href: "/vacaciones?tab=permiso" },
  { key: "certificate", name: "Certificado", description: "Laboral o de antigüedad", icon: FileText, href: "/documentos?generar=1" },
  { key: "data_change", name: "Cambio de datos", description: "Teléfono, dirección, contacto de emergencia", icon: UserPen, href: "/mi-ficha" },
  { key: "generic", name: "Solicitud general", description: "Equipos, accesos, otros", icon: Inbox },
]

export function NewRequestDialog({ slug }: { slug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [generic, setGeneric] = useState(false)
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const submitGeneric = () =>
    startTransition(async () => {
      if (!title.trim()) {
        toast.error("Escribe un título.")
        return
      }
      const res = await createRequest(slug, { type_key: "generic", title: title.trim(), payload: { note } })
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
        setGeneric(false)
        setTitle("")
        setNote("")
      } else toast.error(res.error)
    })

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Nueva solicitud
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setGeneric(false)
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{generic ? "Solicitud general" : "¿Qué necesitas solicitar?"}</DialogTitle>
            <DialogDescription>{generic ? "Pasará por tu líder y luego por Gestión Humana." : "Elige un tipo de solicitud del catálogo."}</DialogDescription>
          </DialogHeader>
          {generic ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gen-title">Título</Label>
                <Input id="gen-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Cambio de silla ergonómica" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gen-note">Descripción</Label>
                <Textarea id="gen-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGeneric(false)}>
                  Volver
                </Button>
                <Button onClick={submitGeneric} disabled={pending}>
                  {pending ? "Enviando…" : "Enviar"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {CATALOG.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (c.href) {
                        setOpen(false)
                        router.push(`/t/${slug}${c.href}`)
                      } else setGeneric(true)
                    }}
                    className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
