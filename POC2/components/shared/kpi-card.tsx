import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({ label, value, hint, icon: Icon, tone = "default" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: "default" | "warning" | "success" | "destructive" }) {
  return (
    <Card className="flex flex-row items-start justify-between gap-3 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {Icon && (
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", tone === "warning" && "bg-warning/15 text-amber-700", tone === "success" && "bg-success/15 text-emerald-700", tone === "destructive" && "bg-destructive/10 text-destructive")}>
          <Icon className="size-4" aria-hidden />
        </span>
      )}
    </Card>
  )
}
