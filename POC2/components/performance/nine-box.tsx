"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { movePerformance } from "@/lib/actions"
import { fullName, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface NinePerson {
  id: string
  first_name: string
  last_name: string
  position: string | null
  performance: number | null
  potential: number | null
}

const COLS = [
  { score: 1, label: "Bajo" },
  { score: 2, label: "Medio" },
  { score: 3, label: "Alto" },
]
const ROWS = [
  { score: 3, label: "Alto" },
  { score: 2, label: "Medio" },
  { score: 1, label: "Bajo" },
]

const CELL: Record<string, string> = {
  "3-1": "Enigma",
  "3-2": "Futuro",
  "3-3": "Estrella",
  "2-1": "Inconsistente",
  "2-2": "Clave",
  "2-3": "Alto desempeño",
  "1-1": "Riesgo",
  "1-2": "Efectivo",
  "1-3": "Experto",
}

export function NineBox({ slug, people, editable }: { slug: string; people: NinePerson[]; editable: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const current = people.find((p) => p.id === selected) ?? null
  const unrated = people.filter((p) => p.performance == null || p.potential == null)

  const move = (performance: number, potential: number) => {
    if (!editable || !selected) return
    startTransition(async () => {
      const res = await movePerformance(slug, selected, performance, potential)
      if (!res.ok) toast.error(res.error)
      else toast.success(`${fullName(current)} quedó en ${CELL[`${potential}-${performance}`]}.`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[4.5rem_1fr_1fr_1fr] gap-2">
        <div />
        {COLS.map((col) => (
          <p key={col.score} className="text-center text-xs font-medium text-muted-foreground">
            Desempeño {col.label.toLowerCase()}
          </p>
        ))}
        {ROWS.map((row) => (
          <div key={row.score} className="contents">
            <p className="flex items-center text-xs font-medium text-muted-foreground">Potencial {row.label.toLowerCase()}</p>
            {COLS.map((col) => {
              const key = `${row.score}-${col.score}`
              const inside = people.filter((p) => p.potential === row.score && p.performance === col.score)
              return (
                <div key={key} className="flex min-h-36 flex-col gap-2 rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{CELL[key]}</span>
                    {editable && (
                      <button
                        type="button"
                        disabled={!selected || pending}
                        onClick={() => move(col.score, row.score)}
                        className="text-[11px] font-medium text-primary disabled:opacity-40"
                      >
                        Ubicar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inside.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        aria-pressed={selected === person.id}
                        title={fullName(person)}
                        onClick={() => setSelected(person.id)}
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary",
                          selected === person.id && "ring-2 ring-primary ring-offset-2",
                        )}
                      >
                        {initials(person)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {editable
          ? current
            ? `Seleccionado: ${fullName(current)}. Elige un cuadrante para calibrarlo.`
            : "Selecciona a una persona y luego el cuadrante donde quieres ubicarla."
          : "Así está calibrado el talento en el ciclo 2026-H1."}
      </p>

      {unrated.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Sin evaluar ({unrated.length})</p>
          <div className="flex flex-wrap gap-2">
            {unrated.map((person) => (
              <button
                key={person.id}
                type="button"
                aria-pressed={selected === person.id}
                onClick={() => setSelected(person.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  selected === person.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                {fullName(person)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
