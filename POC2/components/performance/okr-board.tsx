"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { EmployeeAvatar } from "@/components/shared/employee-avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  KR_STATUS_LABEL,
  formatKrValue,
  krProgress,
  krStatus,
  objectiveProgress,
  type OkrObjective,
  type OkrPerson,
  type KrStatus,
} from "@/lib/okrs"
import { cn } from "@/lib/utils"

type PersonBundle = { person: OkrPerson; objectives: OkrObjective[] }
type DeptBundle = { name: string; objectives: OkrObjective[] }

const STATUS_TONE: Record<KrStatus, string> = {
  on_track: "bg-emerald-600 text-white",
  at_risk: "bg-amber-500 text-white",
  behind: "bg-red-600 text-white",
}

export function OkrBoard({
  company,
  departments,
  people,
  currentEmployeeId,
}: {
  company: OkrObjective[]
  departments: DeptBundle[]
  people: PersonBundle[]
  currentEmployeeId: string
}) {
  const myDept = people.find((row) => row.person.id === currentEmployeeId)?.person.department
  const [area, setArea] = useState(myDept && departments.some((d) => d.name === myDept) ? myDept : (departments[0]?.name ?? ""))
  const [q, setQ] = useState("")

  const shownPeople = useMemo(() => {
    const term = q.trim().toLowerCase()
    const mine = people.find((row) => row.person.id === currentEmployeeId)
    const rest = people.filter((row) => row.person.id !== currentEmployeeId)
    const ordered = mine ? [mine, ...rest] : rest
    return ordered.filter((row) => {
      const hay = `${row.person.first_name} ${row.person.last_name} ${row.person.position ?? ""} ${row.person.department}`.toLowerCase()
      return !term || hay.includes(term)
    })
  }, [people, q, currentEmployeeId])

  const activeDept = departments.find((d) => d.name === area) ?? departments[0]

  return (
    <Tabs defaultValue="company" className="gap-4">
      <div className="-mx-1 overflow-x-auto px-1">
        <TabsList className="h-auto min-h-8 w-max max-w-full">
          <TabsTrigger value="company" className="px-3">
            Compañía
          </TabsTrigger>
          <TabsTrigger value="department" className="px-3">
            Departamento
          </TabsTrigger>
          <TabsTrigger value="person" className="px-3">
            Persona
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="company" className="flex flex-col gap-3">
        {company.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}
      </TabsContent>

      <TabsContent value="department" className="flex flex-col gap-4">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Departamentos">
          {departments.map((dept) => (
            <button
              key={dept.name}
              type="button"
              onClick={() => setArea(dept.name)}
              aria-pressed={area === dept.name}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                area === dept.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {dept.name}
            </button>
          ))}
        </nav>
        {activeDept?.objectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}
      </TabsContent>

      <TabsContent value="person" className="flex flex-col gap-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar persona, cargo o área" className="pl-9" aria-label="Buscar persona" />
        </label>
        {shownPeople.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay personas con ese filtro.</p>
        ) : (
          shownPeople.map((row) => (
            <div key={row.person.id} className="flex flex-col gap-3">
              {row.objectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} highlight={row.person.id === currentEmployeeId} />
              ))}
            </div>
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}

function ObjectiveCard({ objective, highlight = false }: { objective: OkrObjective; highlight?: boolean }) {
  const progress = objectiveProgress(objective)
  const person = objective.ownerName?.includes(" ")
    ? { first_name: objective.ownerName.split(" ")[0] ?? "", last_name: objective.ownerName.split(" ").slice(1).join(" "), position: objective.ownerRole }
    : null

  return (
    <Card className={cn("p-4 sm:p-5", highlight && "ring-2 ring-primary/30")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{objective.level === "company" ? "Compañía" : objective.level === "department" ? "Departamento" : "Persona"}</Badge>
            {objective.department && objective.level !== "department" && <Badge variant="outline">{objective.department}</Badge>}
            {highlight && <Badge>Tus OKRs</Badge>}
          </div>
          <h3 className="mt-2 text-base font-semibold text-pretty sm:text-lg">{objective.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{objective.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {person ? <EmployeeAvatar person={person} /> : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{objective.ownerName}</p>
            <p className="truncate text-xs text-muted-foreground">{objective.ownerRole} · {objective.period}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Avance del objetivo</span>
          <span className="tabular-nums font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {objective.keyResults.map((kr) => {
          const status = krStatus(kr)
          const value = krProgress(kr)
          return (
            <li key={kr.id} className="rounded-xl border bg-muted/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm font-medium text-pretty">{kr.title}</p>
                <span className={cn("inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_TONE[status])}>
                  {KR_STATUS_LABEL[status]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {formatKrValue(kr.current, kr.unit)}
                  <span className="mx-1">/</span>
                  {formatKrValue(kr.target, kr.unit)}
                  {kr.direction === "down" ? " · menor es mejor" : ""}
                </span>
                <span className="tabular-nums font-medium text-foreground">{Math.round(value)}%</span>
              </div>
              <ProgressBar value={value} className="mt-2" tone={status} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ProgressBar({ value, className, tone }: { value: number; className?: string; tone?: KrStatus }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-primary", tone === "at_risk" && "bg-amber-500", tone === "behind" && "bg-red-600")}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
