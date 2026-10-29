import type { DocumentRow } from "@/lib/types"
import { Card } from "@/components/ui/card"

export function SignaturesReport({ docs }: { docs: DocumentRow[] }) {
  const groups = new Map<string, { total: number; signed: number }>()
  for (const d of docs) {
    const g = groups.get(d.name) ?? { total: 0, signed: 0 }
    g.total++
    if (d.status === "signed") g.signed++
    groups.set(d.name, g)
  }
  const rows = Array.from(groups.entries())
    .filter(([, g]) => g.total > 1)
    .sort((a, b) => b[1].total - a[1].total)
  if (rows.length === 0) return null

  return (
    <Card className="gap-4 p-5">
      <ul className="flex flex-col gap-4">
        {rows.map(([name, g]) => {
          const pct = Math.round((g.signed / g.total) * 100)
          return (
            <li key={name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {g.signed}/{g.total} firmados · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${name}: ${pct}% firmado`}>
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
