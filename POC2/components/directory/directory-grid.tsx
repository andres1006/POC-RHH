"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, Mail, Search, Users } from "lucide-react"
import { EmployeeAvatar, PersonCell } from "@/components/shared/employee-avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Person {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  position: string | null
  email: string | null
  department: string
}

export function DirectoryGrid({ slug, employees, departments }: { slug: string; employees: Person[]; departments: { id: string; name: string }[] }) {
  const [q, setQ] = useState("")
  const [dept, setDept] = useState("all")
  const [view, setView] = useState<"grid" | "table">("grid")

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return employees.filter((e) => (dept === "all" || e.department === dept) && (!term || `${e.first_name} ${e.last_name} ${e.position ?? ""} ${e.email ?? ""}`.toLowerCase().includes(term)))
  }, [employees, q, dept])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, cargo o correo" className="pl-9" aria-label="Buscar en el directorio" />
        </div>
        <Select value={dept} onValueChange={(v) => setDept(v as string)} items={{ all: "Todas las áreas", ...Object.fromEntries(departments.map((d) => [d.name, d.name])) }}>
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por área">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")} aria-label="Vista de tarjetas" aria-pressed={view === "grid"}>
            <LayoutGrid />
          </Button>
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" onClick={() => setView("table")} aria-label="Vista de tabla" aria-pressed={view === "table"}>
            <List />
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Users} title="Sin resultados" description="Prueba con otro nombre o área." />
      ) : view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <li key={e.id}>
              <Card className="h-full gap-3 p-4">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar person={e} className="size-12" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {e.first_name} {e.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.position}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{e.department}</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" aria-hidden /> {e.email}
                </p>
                <Button variant="outline" size="sm" render={<Link href={`/t/${slug}/directorio/${e.id}`} />} nativeButton={false} className="mt-auto">
                  Ver ficha
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead className="hidden md:table-cell">Área</TableHead>
                <TableHead className="hidden sm:table-cell">Correo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <PersonCell person={e} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{e.department}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{e.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/t/${slug}/directorio/${e.id}`} />} nativeButton={false}>
                      Ver ficha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
