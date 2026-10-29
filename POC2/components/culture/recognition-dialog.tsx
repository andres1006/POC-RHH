"use client"

import { useState, useTransition } from "react"
import { Award } from "lucide-react"
import { toast } from "sonner"
import { giveRecognition } from "@/lib/actions"
import { fullName } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const VALUES = ["Colaboración", "Servicio", "Innovación", "Compromiso"]

export function RecognitionDialog({
  slug,
  people,
  defaultOpen,
}: {
  slug: string
  people: { id: string; first_name: string; last_name: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const [toId, setToId] = useState(people[0]?.id ?? "")
  const [value, setValue] = useState(VALUES[0])
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()
  const peopleItems = Object.fromEntries(people.map((p) => [p.id, fullName(p)]))
  const valueItems = Object.fromEntries(VALUES.map((v) => [v, v]))

  const submit = () =>
    startTransition(async () => {
      const res = await giveRecognition(slug, toId, value, message)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
        setMessage("")
      } else toast.error(res.error)
    })

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={people.length === 0}>
        <Award /> Reconocer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reconocer a un compañero</DialogTitle>
            <DialogDescription>Se publica en el portal y le llega un aviso.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-person">Persona</Label>
              <Select value={toId} onValueChange={(v) => setToId(String(v ?? ""))} items={peopleItems}>
                <SelectTrigger id="rec-person" className="w-full">
                  <SelectValue placeholder="Elige a alguien" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {fullName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-value">Valor</Label>
              <Select value={value} onValueChange={(v) => setValue(String(v ?? VALUES[0]))} items={valueItems}>
                <SelectTrigger id="rec-value" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALUES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-message">Mensaje</Label>
              <Textarea id="rec-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="¿Qué hizo que valga la pena reconocerlo?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending || !toId || !message.trim()}>
              {pending ? "Enviando…" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
