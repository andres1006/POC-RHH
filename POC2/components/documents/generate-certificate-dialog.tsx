"use client"

import { useState, useTransition } from "react"
import { FilePlus2, FileText, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { generateCertificate } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function GenerateCertificateDialog({ slug, templates, defaultOpen = false }: { slug: string; templates: { id: string; name: string; requires_reviewer: boolean }[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [pending, startTransition] = useTransition()

  const generate = (id: string) =>
    startTransition(async () => {
      const res = await generateCertificate(slug, id)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else toast.error(res.error)
    })

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <FilePlus2 /> Generar certificado
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar documento</DialogTitle>
            <DialogDescription>Elige una plantilla. Los que requieren revisión pasan primero por Gestión Humana.</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => generate(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.requires_reviewer ? "Requiere revisión de RR. HH." : "Se genera al instante"}</span>
                  </span>
                  {t.requires_reviewer && <ShieldCheck className="size-4 text-muted-foreground" aria-label="Requiere revisor" />}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
