"use client"

import { useState } from "react"
import { Download, FileText, PenLine } from "lucide-react"
import type { DocumentRow } from "@/lib/types"
import { formatDate, formatDateTime } from "@/lib/format"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PersonCell } from "@/components/shared/employee-avatar"
import { SignDialog } from "./sign-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function DocumentsTable({ docs, slug, canSign, showEmployee = false }: { docs: DocumentRow[]; slug: string; canSign: boolean; showEmployee?: boolean }) {
  const [filter, setFilter] = useState<"all" | "pending">("all")
  const [signing, setSigning] = useState<DocumentRow | null>(null)
  const list = filter === "all" ? docs : docs.filter((d) => d.status === "pending_signature")
  const pendingCount = docs.filter((d) => d.status === "pending_signature").length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(
          [
            ["all", `Todos (${docs.length})`],
            ["pending", `Pendientes (${pendingCount})`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={cn("rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted", filter === k && "border-primary bg-primary/10 text-primary")}>
            {label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FileText} title="Sin documentos" description={filter === "pending" ? "No tienes documentos pendientes de firma." : "Aún no hay documentos."} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {showEmployee && <TableHead>Colaborador</TableHead>}
                <TableHead>Documento</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((d) => (
                <TableRow key={d.id}>
                  {showEmployee && (
                    <TableCell>
                      <PersonCell person={d.employee} />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden /> {d.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{d.signed_at ? formatDateTime(d.signed_at) : formatDate(d.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {d.status === "pending_signature" && canSign && (
                        <Button size="sm" onClick={() => setSigning(d)}>
                          <PenLine /> Firmar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" render={<a href={d.file_path ?? "#"} target="_blank" rel="noreferrer" aria-label={`Descargar ${d.name}`} />} nativeButton={false}>
                        <Download />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <SignDialog doc={signing} slug={slug} open={!!signing} onOpenChange={(o) => !o && setSigning(null)} />
    </div>
  )
}
