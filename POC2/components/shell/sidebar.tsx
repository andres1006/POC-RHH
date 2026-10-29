"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import type { Role, Tenant } from "@/lib/types"
import { visibleGroups } from "./nav"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  tenant: Tenant
  role: Role
  base: string
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
}

export function Sidebar({ tenant, role, base, collapsed, onToggle, onNavigate }: Props) {
  const pathname = usePathname()
  const groups = visibleGroups(role, tenant.modules)
  const hrefs = groups.flatMap((group) => group.items.map((item) => `${base}${item.href}`))

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center gap-3 border-b px-4", collapsed && "justify-center px-0")}>
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
          {tenant.logo_url ? <Image src={tenant.logo_url} alt="" width={28} height={28} /> : <span className="font-semibold text-primary">{tenant.name[0]}</span>}
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tenant.name}</p>
            <p className="truncate text-xs text-muted-foreground">Nexo RH</p>
          </div>
        )}
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const href = `${base}${item.href}`
                const active =
                  item.href === ""
                    ? pathname === base
                    : pathname === href ||
                      (pathname.startsWith(`${href}/`) &&
                        !hrefs.some((other) => other !== href && other.startsWith(`${href}/`) && (pathname === other || pathname.startsWith(`${other}/`))))
                const Icon = item.icon
                const link = (
                  <Link
                    href={item.soon ? "#" : href}
                    aria-disabled={item.soon || undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary",
                      item.soon && "cursor-default opacity-60 hover:bg-transparent",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.soon && (
                      <Badge variant="outline" className="text-[10px]">
                        Pronto
                      </Badge>
                    )}
                  </Link>
                )
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger render={<span className="block" />}>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggle && (
        <div className="border-t p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent", collapsed && "justify-center px-0")}
          >
            {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      )}
    </div>
  )
}
