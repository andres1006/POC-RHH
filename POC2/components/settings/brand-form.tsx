"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateTenantBrand } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const MODULES: { key: string; label: string }[] = [
  { key: "feed", label: "Portal y comunicados" },
  { key: "leaves", label: "Vacaciones y permisos" },
  { key: "documents", label: "Documentos" },
  { key: "onboarding", label: "Onboarding" },
  { key: "attendance", label: "Asistencia y turnos" },
  { key: "performance", label: "Desempeño" },
  { key: "recognitions", label: "Reconocimientos" },
  { key: "benefits", label: "Beneficios" },
  { key: "analytics", label: "Indicadores" },
]

export function BrandForm({
  slug,
  initial,
}: {
  slug: string
  initial: { name: string; primary_color: string; logo_url: string; modules: Record<string, boolean> }
}) {
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.primary_color)
  const [logo, setLogo] = useState(initial.logo_url)
  const [modules, setModules] = useState<Record<string, boolean>>({
    ...Object.fromEntries(MODULES.map((m) => [m.key, true])),
    ...initial.modules,
  })
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const res = await updateTenantBrand(slug, { name, primary_color: color, logo_url: logo, modules })
      if (res.ok) toast.success(res.message)
      else toast.error(res.error)
    })

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand-name">Nombre de la empresa</Label>
          <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand-logo">Logo (ruta o URL)</Label>
          <Input id="brand-logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="/logos/andina.png" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand-color">Color de marca</Label>
          <div className="flex items-center gap-2">
            <Input id="brand-color" type="color" value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#2563EB"} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 p-1" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color hexadecimal" className="max-w-40 font-mono" />
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Módulos visibles</legend>
        {MODULES.map((mod) => (
          <label key={mod.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <span className="text-sm">{mod.label}</span>
            <Switch checked={modules[mod.key] !== false} onCheckedChange={(checked) => setModules((current) => ({ ...current, [mod.key]: checked }))} />
          </label>
        ))}
      </fieldset>

      <div>
        <Button onClick={save} disabled={pending || !name.trim()}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )
}
