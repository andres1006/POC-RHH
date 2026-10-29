"use client"

import { useState, type ReactNode } from "react"
import type { Notification, Role, Tenant } from "@/lib/types"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { MobileTabBar } from "./mobile-tab-bar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

export interface ShellEmployee {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  position: string | null
}

export interface ShellProps {
  tenant: Tenant
  role: Role
  employee: ShellEmployee
  notifications: Notification[]
  tenants: { slug: string; name: string; role: Role }[]
  people: { id: string; first_name: string; last_name: string; position: string | null }[]
  children: ReactNode
}

export function AppShell({ tenant, role, employee, notifications, tenants, people, children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const base = `/t/${tenant.slug}`

  return (
    <div className="flex min-h-dvh">
      <aside className={`sticky top-0 hidden h-dvh shrink-0 border-r bg-sidebar transition-[width] duration-200 md:block ${collapsed ? "w-16" : "w-64"}`}>
        <Sidebar tenant={tenant} role={role} base={base} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <Sidebar tenant={tenant} role={role} base={base} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar tenant={tenant} role={role} employee={employee} notifications={notifications} tenants={tenants} people={people} base={base} onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
        <MobileTabBar base={base} notifications={notifications.filter((n) => !n.read_at).length} onOpenMenu={() => setMobileOpen(true)} />
      </div>
    </div>
  )
}
