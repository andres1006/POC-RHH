"use client"

import { useMemo, useState } from "react"
import { Download, Inbox } from "lucide-react"
import type { RequestRow } from "@/lib/types"
import { formatDate, fullName, TYPE_LABEL } from "@/lib/format"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonCell } from "@/components/shared/employee-avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { RequestDetailSheet } from "./request-detail-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_ITEMS = { all: "Todos los estados", pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada", cancelled: "Cancelada" }
const TYPE_ITEMS = { all: "Todos los tipos", ...TYPE_LABEL }

interface Props {
  requests: RequestRow[]
  slug: string
  currentEmployeeId: string
  canDecide: boolean
  showRequester?: boolean
  exportable?: boolean
  departments?: string[]
}

export function RequestsTable({ requests, slug, currentEmployeeId, canDecide, showRequester = true, exportable = false, departments = [] }: Props) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [dept, setDept] = useState("all")
  const [selected, setSelected] = useState<RequestRow | null>(null)
  const deptItems = useMemo(() => ({ all: "Todas las áreas", ...Object.fromEntries(departments.map((d) => [d, d])) }), [departments])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return requests.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (type === "all" || r.type_key === type) &&
        (dept === "all" || r.requester?.department?.name === dept) &&
        (!term || `${r.title} ${fullName(r.requester)} ${r.id}`.toLowerCase().includes(term)),
    )
  }, [requests, q, status, type, dept])

  const exportCsv = () => {
    const header = ["ID", "Título", "Tipo", "Solicitante", "Área", "Estado", "Creación", "Cierre"]
    const rows = list.map((r) => [r.id.slice(0, 8), r.title, TYPE_LABEL[r.type_key] ?? r.type_key, fullName(r.requester), r.requester?.department?.name ?? "", r.status, formatDate(r.created_at), formatDate(r.closed_at)])
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "solicitudes.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ID, título o solicitante" aria-label="Buscar solicitudes" className="lg:max-w-xs" />
        <Select value={status} onValueChange={(v) => setStatus(v as string)} items={STATUS_ITEMS}>
          <SelectTrigger className="lg:w-44" aria-label="Estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobada</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as string)} items={TYPE_ITEMS}>
          <SelectTrigger className="lg:w-44" aria-label="Tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select value={dept} onValueChange={(v) => setDept(v as string)} items={deptItems}>
            <SelectTrigger className="lg:w-44" aria-label="Área">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {exportable && (
          <Button variant="outline" onClick={exportCsv} className="lg:ml-auto">
            <Download /> Exportar CSV
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Inbox} title="Sin solicitudes" description="No hay solicitudes que coincidan con los filtros." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                {showRequester && <TableHead className="hidden md:table-cell">Solicitante</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Progreso</TableHead>
                <TableHead className="hidden sm:table-cell">Creación</TableHead>
                <TableHead className="hidden lg:table-cell">Cierre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => {
                const total = r.steps?.length ?? 1
                const done = r.steps?.filter((s) => s.status !== "pending").length ?? 0
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(r)}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">#{r.id.slice(0, 6)}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{TYPE_LABEL[r.type_key] ?? r.type_key}</TableCell>
                    {showRequester && (
                      <TableCell className="hidden md:table-cell">
                        <PersonCell person={r.requester} subtitle={r.requester?.department?.name} />
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {done}/{total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(r.created_at)}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(r.closed_at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RequestDetailSheet request={selected} onOpenChange={(o) => !o && setSelected(null)} slug={slug} currentEmployeeId={currentEmployeeId} canDecide={canDecide} />
    </div>
  )
}
