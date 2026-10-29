import { STATUS_LABEL } from "@/lib/format"
import { cn } from "@/lib/utils"

const STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-amber-800 dark:text-amber-300",
  pending_signature: "bg-warning/15 text-amber-800 dark:text-amber-300",
  in_progress: "bg-primary/10 text-primary",
  approved: "bg-success/15 text-emerald-800 dark:text-emerald-300",
  signed: "bg-success/15 text-emerald-800 dark:text-emerald-300",
  completed: "bg-success/15 text-emerald-800 dark:text-emerald-300",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STYLES[status] ?? "bg-muted text-muted-foreground", className)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
