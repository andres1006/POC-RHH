"use client"

import { useTransition } from "react"
import { Building2, ChevronDown, Loader2, UserCog } from "lucide-react"
import { switchDemoUser } from "@/lib/actions"
import { DEMO_MODE, DEMO_ROLES, DEMO_TENANTS } from "@/lib/demo"
import { ROLE_LABEL } from "@/lib/format"
import type { Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DemoSwitcher({ currentSlug, currentRole }: { currentSlug: string; currentRole: Role; tenants: { slug: string; name: string }[] }) {
  const [pending, startTransition] = useTransition()
  if (!DEMO_MODE) return null

  const tenant = DEMO_TENANTS.find((t) => t.slug === currentSlug)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        {pending ? <Loader2 className="animate-spin" /> : <UserCog />}
        <span className="hidden sm:inline">{tenant?.name ?? currentSlug}</span>
        <span className="text-muted-foreground">· {ROLE_LABEL[currentRole]}</span>
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuRadioGroup value={currentRole} onValueChange={(v) => startTransition(() => switchDemoUser(currentSlug, v as Role))}>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Modo demo · cambiar rol</DropdownMenuLabel>
          {DEMO_ROLES.map((r) => (
            <DropdownMenuRadioItem key={r} value={r}>
              {ROLE_LABEL[r]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentSlug} onValueChange={(v) => startTransition(() => switchDemoUser(v, currentRole))}>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar empresa</DropdownMenuLabel>
          {DEMO_TENANTS.map((t) => (
            <DropdownMenuRadioItem key={t.slug} value={t.slug}>
              <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: t.color }} aria-hidden />
              {t.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden /> Cada empresa tiene datos, logo y color propios.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
