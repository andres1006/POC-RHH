"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Gift, Home, Inbox, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileTabBar({ base, notifications, onOpenMenu }: { base: string; notifications: number; onOpenMenu: () => void }) {
  const pathname = usePathname()
  const tabs = [
    { label: "Inicio", href: base, icon: Home, exact: true },
    { label: "Solicitudes", href: `${base}/solicitudes`, icon: Inbox },
    { label: "Beneficios", href: `${base}/beneficios`, icon: Gift },
    { label: "Pendientes", href: `${base}/pendientes`, icon: Bell, badge: notifications },
  ]
  return (
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur md:hidden">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground", active && "text-primary")}>
            <t.icon className="size-5" aria-hidden />
            {t.label}
            {t.badge ? <span className="absolute right-4 top-1 size-2 rounded-full bg-primary" aria-hidden /> : null}
          </Link>
        )
      })}
      <button type="button" onClick={onOpenMenu} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground">
        <Menu className="size-5" aria-hidden />
        Menú
      </button>
    </nav>
  )
}
