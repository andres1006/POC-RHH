"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CheckCheck, CheckCircle2, FileSignature, Megaphone, PartyPopper, Rocket } from "lucide-react"
import type { Notification } from "@/lib/types"
import { markAllNotificationsRead } from "@/lib/actions"
import { formatDateTime } from "@/lib/format"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { key: "all", label: "Todas" },
  { key: "approval", label: "Aprobaciones" },
  { key: "signature", label: "Firmas pendientes" },
  { key: "onboarding", label: "Tareas de onboarding" },
  { key: "notice", label: "Avisos" },
]

const ICONS: Record<string, typeof Megaphone> = {
  approval: CheckCircle2,
  signature: FileSignature,
  onboarding: Rocket,
  notice: Megaphone,
}

export function NotificationsDrawer({ open, onOpenChange, notifications, slug }: { open: boolean; onOpenChange: (o: boolean) => void; notifications: Notification[]; slug: string }) {
  const [cat, setCat] = useState("all")
  const [pending, startTransition] = useTransition()
  const list = notifications.filter((n) => cat === "all" || n.kind === cat)
  const unread = notifications.filter((n) => !n.read_at).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Pendientes</SheetTitle>
          <SheetDescription>{unread ? `${unread} sin leer` : "Todo al día"}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-wrap gap-2 border-b px-5 py-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              aria-pressed={cat === c.key}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted", cat === c.key && "border-primary bg-primary/10 text-primary")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                <PartyPopper className="size-7" aria-hidden />
              </span>
              <p className="font-medium">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground">No tienes pendientes en esta categoría.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((n) => {
                const Icon = ICONS[n.kind] ?? Megaphone
                return (
                  <li key={n.id}>
                    <Link href={n.link ?? `/t/${slug}`} onClick={() => onOpenChange(false)} className={cn("flex gap-3 px-5 py-3 hover:bg-muted/60", !n.read_at && "bg-primary/5")}>
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className={cn("text-sm leading-snug", !n.read_at && "font-medium")}>{n.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {unread > 0 && (
          <div className="border-t p-3">
            <Button variant="outline" className="w-full" disabled={pending} onClick={() => startTransition(() => markAllNotificationsRead(slug).then(() => undefined))}>
              <CheckCheck /> Marcar todo como leído
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
