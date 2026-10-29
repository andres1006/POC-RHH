"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateMemberRole } from "@/lib/actions"
import { ROLE_LABEL, fullName } from "@/lib/format"
import type { Role } from "@/lib/types"
import { PersonCell } from "@/components/shared/employee-avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ROLES: Role[] = ["employee", "leader", "hr", "admin"]

export interface MemberRow {
  id: string
  role: Role
  employee: { id: string; first_name: string; last_name: string; avatar_url?: string | null; position?: string | null; email?: string | null } | null
}

export function RolesTable({ slug, members, currentEmployeeId }: { slug: string; members: MemberRow[]; currentEmployeeId: string }) {
  const [pending, startTransition] = useTransition()
  const items = Object.fromEntries(ROLES.map((role) => [role, ROLE_LABEL[role]]))

  const change = (membershipId: string, role: Role) =>
    startTransition(async () => {
      const res = await updateMemberRole(slug, membershipId, role)
      if (res.ok) toast.success(res.message)
      else toast.error(res.error)
    })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Persona</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const mine = member.employee?.id === currentEmployeeId
          return (
            <TableRow key={member.id}>
              <TableCell>
                <PersonCell person={member.employee} />
              </TableCell>
              <TableCell className="text-muted-foreground">{member.employee?.email ?? "—"}</TableCell>
              <TableCell>
                <Select value={member.role} items={items} disabled={mine || pending} onValueChange={(value) => change(member.id, value as Role)}>
                  <SelectTrigger className="w-44" aria-label={`Rol de ${fullName(member.employee)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
