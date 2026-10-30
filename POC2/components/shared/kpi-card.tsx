import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({ label, value, hint, icon: Icon, tone = "default" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: "default" | "warning" | "success" | "destructive" }) {
  return (
    <Card className="flex flex-row items-start justify-between gap-3 p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {Icon && (
        <span className={cn("hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex", tone === "warning" && "bg-warning/15 text-amber-700", tone === "success" && "bg-success/15 text-emerald-700", tone === "destructive" && "bg-destructive/10 text-destructive")}>
          <Icon className="size-4" aria-hidden />
        </span>
      )}
    </Card>
  )
}
