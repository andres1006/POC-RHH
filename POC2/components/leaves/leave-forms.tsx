"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, isValid } from "date-fns"
import { CalendarDays, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { createRequest } from "@/lib/actions"
import { businessDays } from "@/lib/business-days"
import { formatDays } from "@/lib/format"
import type { LeaveBalance } from "@/lib/types"
import { availableDays } from "@/lib/data-helpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PERMISSION_TYPES = ["Remunerado", "No remunerado", "Cita médica", "Día de la familia", "Votación"]

export function LeaveForms({ slug, balance, holidays, defaultTab }: { slug: string; balance: LeaveBalance; holidays: string[]; defaultTab: "vacaciones" | "permiso" }) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
        <TabsTrigger value="permiso">Permiso</TabsTrigger>
      </TabsList>
      <TabsContent value="vacaciones">
        <VacationForm slug={slug} balance={balance} holidays={holidays} />
      </TabsContent>
      <TabsContent value="permiso">
        <PermissionForm slug={slug} />
      </TabsContent>
    </Tabs>
  )
}

function VacationForm({ slug, balance, holidays }: { slug: string; balance: LeaveBalance; holidays: string[] }) {
  const router = useRouter()
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [comment, setComment] = useState("")
  const [pending, startTransition] = useTransition()
  const available = availableDays(balance)

  const days = useMemo(() => {
    const s = parseISO(start)
    const e = parseISO(end)
    if (!isValid(s) || !isValid(e)) return 0
    return businessDays(s, e, holidays)
  }, [start, end, holidays])

  const over = days > available
  const holidaysInRange = useMemo(() => holidays.filter((h) => start && end && h >= start && h <= end), [holidays, start, end])

  const submit = () =>
    startTransition(async () => {
      const res = await createRequest(slug, {
        type_key: "vacation",
        title: `Vacaciones ${format(parseISO(start), "dd/MM")} – ${format(parseISO(end), "dd/MM/yyyy")}`,
        payload: { start_date: start, end_date: end, days, comment },
      })
      if (res.ok) {
        toast.success(res.message)
        setStart("")
        setEnd("")
        setComment("")
        router.push(`/t/${slug}/solicitudes?tab=mine`)
      } else toast.error(res.error)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-primary" aria-hidden /> Solicitar vacaciones
        </CardTitle>
        <CardDescription>Los días hábiles se calculan automáticamente excluyendo fines de semana y festivos de Colombia.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vac-start">Fecha de inicio</Label>
            <Input id="vac-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vac-end">Fecha de fin</Label>
            <Input id="vac-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className={cn("flex flex-col gap-1 rounded-lg border p-3 text-sm", over ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5")} role="status" aria-live="polite">
          <p className="font-medium">
            Estás solicitando <span className="text-lg tabular-nums">{days}</span> {days === 1 ? "día hábil" : "días hábiles"}
          </p>
          <p className="text-xs text-muted-foreground">
            Tienes {formatDays(available)} disponibles{holidaysInRange.length > 0 && ` · ${holidaysInRange.length} festivo(s) excluido(s)`}
          </p>
          {over && <p className="text-xs text-destructive">Excedes tu saldo disponible.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vac-comment">Comentario (opcional)</Label>
          <Textarea id="vac-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ej. Viaje familiar" />
        </div>
        <Button onClick={submit} disabled={pending || days <= 0 || over} className="sm:self-end">
          {pending ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </CardContent>
    </Card>
  )
}

function PermissionForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [type, setType] = useState(PERMISSION_TYPES[2])
  const [mode, setMode] = useState<"day" | "hours">("day")
  const [date, setDate] = useState("")
  const [hours, setHours] = useState("2")
  const [half, setHalf] = useState(false)
  const [file, setFile] = useState("")
  const [comment, setComment] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => {
      if (!date) {
        toast.error("Selecciona la fecha.")
        return
      }
      const res = await createRequest(slug, {
        type_key: "permission",
        title: `Permiso: ${type}`,
        payload: { type, date, ...(mode === "hours" ? { hours: Number(hours) } : { half_day: half }), attachment: file || undefined, comment },
      })
      if (res.ok) {
        toast.success(res.message)
        router.push(`/t/${slug}/solicitudes?tab=mine`)
      } else toast.error(res.error)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Solicitar permiso</CardTitle>
        <CardDescription>Por día completo, media jornada o por horas. Adjunta soporte si aplica.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="perm-type">Tipo de permiso</Label>
            <Select value={type} onValueChange={(v) => setType(v as string)} items={Object.fromEntries(PERMISSION_TYPES.map((t) => [t, t]))}>
              <SelectTrigger id="perm-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="perm-date">Fecha</Label>
            <Input id="perm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Duración</legend>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="perm-mode" checked={mode === "day"} onChange={() => setMode("day")} className="accent-primary" /> Por día
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="perm-mode" checked={mode === "hours"} onChange={() => setMode("hours")} className="accent-primary" /> Por horas
            </label>
            {mode === "day" ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={half} onCheckedChange={(v) => setHalf(Boolean(v))} /> Media jornada
              </label>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Input type="number" min={1} max={8} value={hours} onChange={(e) => setHours(e.target.value)} className="w-20" aria-label="Horas" /> horas
              </div>
            )}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perm-file" className="flex items-center gap-1.5">
            <Paperclip className="size-3.5" aria-hidden /> Soporte (opcional)
          </Label>
          <Input id="perm-file" type="file" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="perm-comment">Comentario</Label>
          <Textarea id="perm-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={pending} className="sm:self-end">
          {pending ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </CardContent>
    </Card>
  )
}
