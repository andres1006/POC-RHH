"use client"

import { useMemo, useState, useTransition } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { sendBulkDocument } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BulkSendDialog({ slug, employees }: { slug: string; employees: { id: string; name: string; department: string }[] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("Política de seguridad de la información 2026")
  const [dept, setDept] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).filter(Boolean), [employees])
  const list = employees.filter((e) => dept === "all" || e.department === dept)
  const allSelected = list.length > 0 && list.every((e) => selected.has(e.id))

  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s)
      if (allSelected) list.forEach((e) => n.delete(e.id))
      else list.forEach((e) => n.add(e.id))
      return n
    })

  const submit = () =>
    startTransition(async () => {
      const res = await sendBulkDocument(slug, name, Array.from(selected))
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
        setSelected(new Set())
      } else toast.error(res.error)
    })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Send /> Envío masivo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar documento a varios colaboradores</DialogTitle>
            <DialogDescription>Cada persona recibirá el documento como pendiente de firma.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-name">Nombre del documento</Label>
              <Input id="bulk-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Select value={dept} onValueChange={(v) => setDept(v as string)} items={{ all: "Todas las áreas", ...Object.fromEntries(departments.map((d) => [d, d])) }}>
                <SelectTrigger className="flex-1" aria-label="Filtrar por área">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {allSelected ? "Quitar todos" : "Seleccionar todos"}
              </Button>
            </div>
            <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border">
              {list.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                    <Checkbox
                      checked={selected.has(e.id)}
                      onCheckedChange={(v) =>
                        setSelected((s) => {
                          const n = new Set(s)
                          if (v) n.add(e.id)
                          else n.delete(e.id)
                          return n
                        })
                      }
                    />
                    <span className="flex-1">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{e.department}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending || selected.size === 0}>
              {pending ? "Enviando…" : `Enviar a ${selected.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
