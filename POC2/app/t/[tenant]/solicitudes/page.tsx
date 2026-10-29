import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { getTenantContext, isHrRole, isManagerRole } from "@/lib/tenant"
import { getDepartments, getRequests } from "@/lib/data"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { RequestsTable } from "@/components/requests/requests-table"
import { NewRequestDialog } from "@/components/requests/new-request-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Solicitudes" }

export default async function RequestsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { tenant: slug } = await params
  const { tab } = await searchParams
  const ctx = await getTenantContext(slug)
  const [all, departments] = await Promise.all([getRequests(ctx.tenant.id), getDepartments(ctx.tenant.id)])

  const mine = all.filter((r) => r.requester_id === ctx.employee.id)
  const toApprove = all.filter((r) => r.status === "pending" && r.steps?.some((s) => s.status === "pending" && s.approver_id === ctx.employee.id))
  const scope = isHrRole(ctx.role) ? all : isManagerRole(ctx.role) ? [...toApprove, ...mine] : mine
  const kpi = (s: string) => scope.filter((r) => r.status === s).length
  const defaultTab = tab ?? (toApprove.length > 0 ? "approve" : "mine")

  return (
    <>
      <PageHeader title="Solicitudes" description="Vacaciones, permisos, certificados y cambios de datos en un solo flujo." actions={<NewRequestDialog slug={slug} />} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard label="En curso" value={kpi("pending")} icon={Clock} tone="warning" />
        <KpiCard label="Aprobadas" value={kpi("approved")} icon={CheckCircle2} tone="success" />
        <KpiCard label="Rechazadas" value={kpi("rejected")} icon={XCircle} tone="destructive" />
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-4">
          {isManagerRole(ctx.role) && (
            <TabsTrigger value="approve">
              Por aprobar {toApprove.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{toApprove.length}</span>}
            </TabsTrigger>
          )}
          <TabsTrigger value="mine">Mis solicitudes</TabsTrigger>
          {isHrRole(ctx.role) && <TabsTrigger value="all">Todas</TabsTrigger>}
        </TabsList>
        {isManagerRole(ctx.role) && (
          <TabsContent value="approve">
            <RequestsTable requests={toApprove} slug={slug} currentEmployeeId={ctx.employee.id} canDecide />
          </TabsContent>
        )}
        <TabsContent value="mine">
          <RequestsTable requests={mine} slug={slug} currentEmployeeId={ctx.employee.id} canDecide={false} showRequester={false} />
        </TabsContent>
        {isHrRole(ctx.role) && (
          <TabsContent value="all">
            <RequestsTable requests={all} slug={slug} currentEmployeeId={ctx.employee.id} canDecide exportable departments={departments.map((d) => d.name)} />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
