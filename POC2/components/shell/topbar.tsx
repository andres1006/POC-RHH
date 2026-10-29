"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Eye, EyeOff, LogOut, Menu, Moon, Search, Sun, UserCircle } from "lucide-react"
import type { Notification, Role, Tenant } from "@/lib/types"
import { fullName, initials, ROLE_LABEL } from "@/lib/format"
import { signOut } from "@/lib/actions"
import { useSensitive } from "./sensitive-context"
import { NotificationsDrawer } from "./notifications-drawer"
import { DemoSwitcher } from "./demo-switcher"
import { visibleGroups } from "./nav"
import type { ShellEmployee } from "./app-shell"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface Props {
  tenant: Tenant
  role: Role
  employee: ShellEmployee
  notifications: Notification[]
  tenants: { slug: string; name: string; role: Role }[]
  people: { id: string; first_name: string; last_name: string; position: string | null }[]
  base: string
  onOpenMenu: () => void
}

export function Topbar({ tenant, role, employee, notifications, tenants, people, base, onOpenMenu }: Props) {
  const router = useRouter()
  const { hidden, toggle } = useSensitive()
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [, startTransition] = useTransition()
  const unread = notifications.filter((n) => !n.read_at).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (href: string) => {
    setSearchOpen(false)
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur md:gap-3 md:px-8">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMenu} aria-label="Abrir menú">
        <Menu />
      </Button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden h-9 w-full max-w-xs items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground hover:bg-muted sm:flex"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Buscar personas y módulos…</span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Buscar">
        <Search />
      </Button>

      <div className="flex-1" />

      <DemoSwitcher currentSlug={tenant.slug} currentRole={role} tenants={tenants} />

      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={toggle} aria-pressed={hidden} aria-label={hidden ? "Mostrar datos sensibles" : "Ocultar datos sensibles"} />}>
          {hidden ? <EyeOff /> : <Eye />}
        </TooltipTrigger>
        <TooltipContent>{hidden ? "Mostrar datos sensibles" : "Ocultar datos sensibles"}</TooltipContent>
      </Tooltip>

      <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen(true)} aria-label={`Pendientes${unread ? `, ${unread} sin leer` : ""}`}>
        <Bell />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menú de usuario" />}>
          <Avatar className="size-9">
            <AvatarImage src={employee.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initials(employee)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="font-medium">{fullName(employee)}</span>
              <span className="text-xs font-normal text-muted-foreground">{employee.position}</span>
              <Badge variant="secondary" className="w-fit">
                {ROLE_LABEL[role]}
              </Badge>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`${base}/mi-ficha`)}>
            <UserCircle /> Mi ficha
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => startTransition(() => signOut())}>
            <LogOut /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} notifications={notifications} slug={tenant.slug} />

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar" description="Busca personas o módulos">
        <CommandInput placeholder="Escribe un nombre o módulo…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Módulos">
            {visibleGroups(role, tenant.modules)
              .flatMap((g) => g.items)
              .filter((i) => !i.soon)
              .map((i) => (
                <CommandItem key={i.href} value={`modulo ${i.label}`} onSelect={() => go(`${base}${i.href}`)}>
                  <i.icon /> {i.label}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Personas">
            {people.map((p) => (
              <CommandItem key={p.id} value={`${p.first_name} ${p.last_name} ${p.position ?? ""}`} onSelect={() => go(`${base}/directorio/${p.id}`)}>
                <UserCircle /> {p.first_name} {p.last_name}
                <span className="ml-auto text-xs text-muted-foreground">{p.position}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
