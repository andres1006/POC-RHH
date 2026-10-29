"use client"

import { useTransition } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { switchDemoUser } from "@/lib/actions"
import { DEMO_ROLES, DEMO_TENANTS } from "@/lib/demo"
import { ROLE_LABEL } from "@/lib/format"
import type { Role } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ROLE_HINT: Record<Role, string> = {
  employee: "Mi inicio, saldo de vacaciones y solicitudes",
  leader: "Aprueba pendientes y ve su equipo",
  hr: "Indicadores, organigrama y onboarding",
  admin: "Marca, módulos y roles de la empresa",
}

export function DemoLauncher() {
  const [pending, startTransition] = useTransition()

  return (
    <section aria-labelledby="demo-title" className="flex flex-col gap-4">
      <h2 id="demo-title" className="text-sm font-medium text-muted-foreground">
        Entra a la demo eligiendo empresa y rol
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_TENANTS.map((t) => (
          <Card key={t.slug} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                <Image src={t.slug === "andina" ? "/logos/eficacia.png" : `/logos/${t.slug}.png`} alt="" width={28} height={28} className="object-contain" />
              </span>
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.slug === "andina" ? "Eficacia RH · fuerza de ventas" : "25 personas · Agroindustria"}</p>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((role) => (
                <Button
                  key={role}
                  variant="outline"
                  disabled={pending}
                  className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                  style={{ borderColor: `${t.color}33` }}
                  onClick={() => startTransition(() => switchDemoUser(t.slug, role))}
                >
                  <span className="font-medium">{ROLE_LABEL[role]}</span>
                  <span className="text-xs font-normal text-muted-foreground text-pretty whitespace-normal">{ROLE_HINT[role]}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {pending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Iniciando sesión en la demo…
        </p>
      )}
    </section>
  )
}
