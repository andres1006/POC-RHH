"use client"

import { useState, useTransition } from "react"
import { Lock, UserPen } from "lucide-react"
import { toast } from "sonner"
import { createRequest } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UpdateDataDialog({ slug, employee }: { slug: string; employee: { phone: string | null; email: string | null } }) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(employee.phone ?? "")
  const [address, setAddress] = useState("")
  const [emergency, setEmergency] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => {
      const changes: Record<string, string> = {}
      if (phone !== (employee.phone ?? "")) changes.phone = phone
      if (address) changes.address = address
      if (emergency) changes.emergency_contact = emergency
      if (Object.keys(changes).length === 0) {
        toast.error("No hay cambios para enviar.")
        return
      }
      const res = await createRequest(slug, { type_key: "data_change", title: "Actualización de datos personales", payload: { changes }, flow: "hr" })
      if (res.ok) {
        toast.success("Solicitud enviada a Gestión Humana para aprobación.")
        setOpen(false)
      } else toast.error(res.error)
    })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserPen /> Actualizar datos
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar mis datos</DialogTitle>
            <DialogDescription>Los cambios se envían a Gestión Humana como una solicitud y se aplican cuando sean aprobados.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="upd-email" className="flex items-center gap-1.5">
                Correo corporativo <Lock className="size-3 text-muted-foreground" aria-hidden />
              </Label>
              <Input id="upd-email" value={employee.email ?? ""} disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="upd-phone">Teléfono</Label>
              <Input id="upd-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="upd-address">Dirección</Label>
              <Input id="upd-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 123 # 45-67, Bogotá" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="upd-emergency">Contacto de emergencia</Label>
              <Input id="upd-emergency" value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="Nombre · teléfono" />
            </div>
            <p className="text-xs text-muted-foreground">Documento de identidad, correo corporativo y fecha de ingreso no se pueden modificar desde aquí.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
