"use client"

import { useState, useTransition } from "react"
import { FileText, PenLine } from "lucide-react"
import { toast } from "sonner"
import { signDocument } from "@/lib/actions"
import type { DocumentRow } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignDialog({ doc, slug, open, onOpenChange }: { doc: DocumentRow | null; slug: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [accepted, setAccepted] = useState(false)
  const [code, setCode] = useState("")
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setAccepted(false)
    setCode("")
  }

  const submit = () => {
    if (!doc) return
    startTransition(async () => {
      const res = await signDocument(slug, doc.id, code)
      if (res.ok) {
        toast.success(res.message)
        onOpenChange(false)
        reset()
      } else toast.error(res.error)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Firmar documento</DialogTitle>
          <DialogDescription>{doc?.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border bg-muted/40 text-muted-foreground">
            <FileText className="size-10" aria-hidden />
            <p className="text-sm">Vista previa del documento (PDF de ejemplo)</p>
            <a href={doc?.file_path ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-4 hover:underline">
              Abrir PDF
            </a>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(Boolean(v))} className="mt-0.5" />
            <span>Acepto el contenido del documento y autorizo su firma electrónica simple.</span>
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sign-code">Código de verificación (6 dígitos)</Label>
            <Input id="sign-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="max-w-40 font-mono tracking-widest" />
            <p className="text-xs text-muted-foreground">En la demo el código siempre es 123456.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!accepted || code.length !== 6 || pending}>
            <PenLine /> {pending ? "Firmando…" : "Firmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
