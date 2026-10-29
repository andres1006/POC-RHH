import { startOfWeek } from "date-fns"
import { getAttendance, getDocuments, getEmployee, getEmployeeEvents, getLeaveBalance, getRequests, availableDays } from "@/lib/data"
import type { Employee, TenantContext } from "@/lib/types"
import { formatDate, formatDays, fullName, tenure } from "@/lib/format"
import { isHrRole } from "@/lib/tenant"
import { EmployeeAvatar } from "@/components/shared/employee-avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import { DocumentsTable } from "@/components/documents/documents-table"
import { UpdateDataDialog } from "./update-data-dialog"
import { SensitiveValue } from "./sensitive-value"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function Field({ label, value, sensitive = false }: { label: string; value: React.ReactNode; sensitive?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{sensitive ? <SensitiveValue>{value}</SensitiveValue> : value}</dd>
    </div>
  )
}

export async function EmployeeProfile({ ctx, employee, isSelf }: { ctx: TenantContext; employee: Employee; isSelf: boolean }) {
  const canSeeSensitive = isSelf || isHrRole(ctx.role)
  const [balance, docs, events, requests, manager, attendance] = await Promise.all([
    getLeaveBalance(employee.id),
    getDocuments(ctx.tenant.id, employee.id),
    getEmployeeEvents(employee.id),
    getRequests(ctx.tenant.id, { requesterId: employee.id }),
    employee.manager_id ? getEmployee(employee.manager_id) : Promise.resolve(null),
    getAttendance(employee.id, startOfWeek(new Date(), { weekStartsOn: 1 })),
  ])
  const vacations = requests.filter((r) => r.type_key === "vacation")
  const s = employee.sensitive ?? {}

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <EmployeeAvatar person={employee} className="size-16 text-base" />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">{fullName(employee)}</h1>
            <p className="text-sm text-muted-foreground">
              {employee.position} · {employee.department?.name}
            </p>
            <Badge variant="outline" className="w-fit">
              {ctx.tenant.name}
            </Badge>
          </div>
        </div>
        {isSelf && <UpdateDataDialog slug={ctx.tenant.slug} employee={{ phone: employee.phone, email: employee.email }} />}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Accordion defaultValue={["general"]} multiple className="flex flex-col gap-3">
          <AccordionItem value="general" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="text-sm font-medium">Información general</AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Documento" value={employee.document_id ?? "—"} sensitive />
                <Field label="Correo" value={employee.email ?? "—"} />
                <Field label="Teléfono" value={employee.phone ?? "—"} />
                <Field label="Nacimiento" value={formatDate(employee.birth_date)} />
              </dl>
            </AccordionContent>
          </AccordionItem>
          {canSeeSensitive && (
            <AccordionItem value="prevision" className="rounded-xl border bg-card px-4">
              <AccordionTrigger className="text-sm font-medium">Previsión y pago</AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Salario" value={<SensitiveValue currency={s.salary} />} />
                  <Field label="EPS" value={s.eps ?? "—"} sensitive />
                  <Field label="Pensión" value={s.pension ?? "—"} sensitive />
                  <Field label="Cesantías" value={s.cesantias ?? "—"} sensitive />
                  <Field label="Banco" value={s.bank ?? "—"} sensitive />
                  <Field label="Cuenta" value={s.account ?? "—"} sensitive />
                </dl>
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="custom" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="text-sm font-medium">Atributos personalizados</AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Talla camiseta" value="M" />
                <Field label="Transporte" value="Ruta empresarial" />
                <Field label="Contacto emergencia" value="Registrado" />
                <Field label="Teletrabajo" value="Híbrido (3 días)" />
              </dl>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Tabs defaultValue="resumen" className="min-w-0">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="historia">Historia</TabsTrigger>
            <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
            <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="pt-4">
            <Card>
              <CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
                <Field label="Cargo" value={employee.position ?? "—"} />
                <Field label="Área" value={employee.department?.name ?? "—"} />
                <Field label="Supervisor" value={manager ? fullName(manager) : "—"} />
                <Field label="Tipo de contrato" value={employee.contract_type ?? "—"} />
                <Field label="Jornada" value={employee.workday ?? "—"} />
                <Field label="Fecha de ingreso" value={`${formatDate(employee.hire_date)} · ${tenure(employee.hire_date)}`} />
                <Field label="Vacaciones disponibles" value={`${formatDays(availableDays(balance))} días`} />
                <Field label="Estado" value={<Badge variant="secondary">Activo</Badge>} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="pt-4">
            <DocumentsTable docs={docs} slug={ctx.tenant.slug} canSign={isSelf} />
          </TabsContent>

          <TabsContent value="historia" className="pt-4">
            <Card>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
                ) : (
                  <ol className="relative flex flex-col gap-6 border-l pl-6">
                    {events.map((ev) => {
                      const changes = ev.changes as Record<string, { before?: string | number; after?: string | number }>
                      return (
                        <li key={ev.id} className="relative">
                          <span className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-background bg-primary" aria-hidden />
                          <p className="text-sm font-medium">{ev.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(ev.occurred_at)}</p>
                          <ul className="mt-2 flex flex-col gap-1 text-sm">
                            {Object.entries(changes).map(([k, v]) => (
                              <li key={k} className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">{k === "salary" ? "Salario" : "Cargo"}:</span>
                                {v.before != null && (
                                  <>
                                    <SensitiveValue currency={k === "salary" ? Number(v.before) : undefined}>{k === "salary" ? undefined : v.before}</SensitiveValue>
                                    <span aria-hidden>→</span>
                                  </>
                                )}
                                <span className="font-medium">
                                  <SensitiveValue currency={k === "salary" ? Number(v.after) : undefined}>{k === "salary" ? undefined : v.after}</SensitiveValue>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacaciones" className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Acumuladas", balance.accrued],
                ["Tomadas", balance.taken],
                ["Programadas", balance.scheduled],
                ["Disponibles", availableDays(balance)],
              ].map(([label, val]) => (
                <Card key={label as string} className="gap-1 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatDays(val as number)}</p>
                </Card>
              ))}
            </div>
            <Card className="p-0">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="text-sm">Vacaciones solicitadas</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin vacaciones registradas.
                      </TableCell>
                    </TableRow>
                  )}
                  {vacations.map((v) => {
                    const p = v.payload as { start_date?: string; end_date?: string; days?: number }
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          {formatDate(p.start_date)} – {formatDate(p.end_date)}
                        </TableCell>
                        <TableCell>{p.days}</TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="asistencia" className="pt-4">
            <Card className="p-0">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="text-sm">Marcas de esta semana</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Sin marcas esta semana.
                      </TableCell>
                    </TableRow>
                  )}
                  {attendance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.kind === "in" ? "Entrada" : "Salida"}</TableCell>
                      <TableCell>{formatDate(m.at, "EEE dd/MM · HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
