"use client"

import { useState, useTransition } from "react"
import { Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { createOnboarding, toggleOnboardingTask } from "@/lib/actions"
import { formatDate, fullName } from "@/lib/format"
import { PersonCell } from "@/components/shared/employee-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface OnboardingTask {
  id: string
  title: string
  owner_role: string
  due_date: string | null
  done_at: string | null
}

export interface OnboardingPerson {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string | null
  position?: string | null
}

export interface OnboardingProcess {
  id: string
  start_date: string
  status: string
  employee: OnboardingPerson | null
  tasks: OnboardingTask[]
}

const OWNER: Record<string, string> = {
  new_hire: "Ingreso",
  hr: "RR. HH.",
  it: "Tecnología",
  leader: "Líder",
}

function progress(tasks: OnboardingTask[]) {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((t) => t.done_at).length / tasks.length) * 100)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function OnboardingBoard({
  slug,
  processes,
  candidates,
  canCreate,
}: {
  slug: string
  processes: OnboardingProcess[]
  candidates: OnboardingPerson[]
  canCreate: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {canCreate && <CreateOnboarding slug={slug} candidates={candidates} />}
      {processes.length === 0 ? null : (
        <div className="grid gap-4 lg:grid-cols-2">
          {processes.map((process) => (
            <ProcessCard key={process.id} slug={slug} process={process} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProcessCard({ slug, process }: { slug: string; process: OnboardingProcess }) {
  const pct = progress(process.tasks)
  const today = todayIso()
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <PersonCell person={process.employee} subtitle={`Inicio ${formatDate(process.start_date)}`} />
        <Badge variant={pct === 100 ? "secondary" : "outline"}>{pct}%</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <ul className="flex flex-col divide-y">
          {process.tasks.map((task) => (
            <TaskRow key={task.id} slug={slug} task={task} overdue={!task.done_at && !!task.due_date && task.due_date < today} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TaskRow({ slug, task, overdue }: { slug: string; task: OnboardingTask; overdue: boolean }) {
  const [pending, startTransition] = useTransition()
  const toggle = () =>
    startTransition(async () => {
      const res = await toggleOnboardingTask(slug, task.id, !task.done_at)
      if (!res.ok) toast.error(res.error)
    })

  return (
    <li className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={!!task.done_at}
        aria-label={task.done_at ? `Marcar pendiente: ${task.title}` : `Completar: ${task.title}`}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.done_at ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
        )}
      >
        {task.done_at && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", task.done_at && "text-muted-foreground line-through")}>{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {OWNER[task.owner_role] ?? task.owner_role}
          {task.due_date ? ` · vence ${formatDate(task.due_date)}` : ""}
        </p>
      </div>
      {overdue && <Badge variant="destructive">Vencida</Badge>}
    </li>
  )
}

function CreateOnboarding({ slug, candidates }: { slug: string; candidates: OnboardingPerson[] }) {
  const [open, setOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState(candidates[0]?.id ?? "")
  const [startDate, setStartDate] = useState(todayIso())
  const [pending, startTransition] = useTransition()
  const items = Object.fromEntries(candidates.map((p) => [p.id, fullName(p)]))

  const submit = () =>
    startTransition(async () => {
      const res = await createOnboarding(slug, employeeId, startDate)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else toast.error(res.error)
    })

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} disabled={candidates.length === 0}>
          <Plus /> Nuevo onboarding
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo ingreso</DialogTitle>
            <DialogDescription>Se crea la plantilla: contrato, seguridad social, equipo, accesos, reunión con el líder e inducción.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="onb-person">Persona</Label>
              <Select value={employeeId} onValueChange={(v) => setEmployeeId(String(v ?? ""))} items={items}>
                <SelectTrigger id="onb-person" className="w-full">
                  <SelectValue placeholder="Elige a alguien" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {fullName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="onb-date">Fecha de inicio</Label>
              <Input id="onb-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending || !employeeId || !startDate}>
              {pending ? "Creando…" : "Crear proceso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
