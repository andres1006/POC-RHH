import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react"
import { findService, matchesService } from "@/lib/catalog"
import { getDepartments, getRequests } from "@/lib/data"
import { getTenantContext, isHrRole, isManagerRole } from "@/lib/tenant"
import { CatalogCreateForm } from "@/components/requests/catalog-create-form"
import { RequestsTable } from "@/components/requests/requests-table"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: { params: Promise<{ servicio: string }> }) {
  const { servicio } = await params
  return { title: findService(servicio)?.title ?? "Servicio" }
}

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string; servicio: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { tenant: slug, servicio } = await params
  const service = findService(servicio)
  if (!service) notFound()
  const { tab } = await searchParams
  const ctx = await getTenantContext(slug)
  const [all, departments] = await Promise.all([getRequests(ctx.tenant.id), getDepartments(ctx.tenant.id)])
  const ofType = all.filter((r) => matchesService(r, service))
  const mine = ofType.filter((r) => r.requester_id === ctx.employee.id)
  const toApprove = ofType.filter((r) => r.status === "pending" && r.steps?.some((s) => s.status === "pending" && s.approver_id === ctx.employee.id))
  const kpi = (s: string) => ofType.filter((r) => r.status === s).length
  const defaultTab = tab ?? (isHrRole(ctx.role) ? "all" : toApprove.length > 0 ? "approve" : "mine")
  const navy = service.variant === "navy"

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/t/${slug}/solicitudes`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Catálogo de servicios
      </Link>

      <div className={cn("overflow-hidden rounded-[18px] border", navy && "bg-[#163E73] text-white")}>
        <div className={cn("relative h-40 sm:h-48", navy && "bg-[#163E73]")}>
          <img src={service.photo} alt="" className={cn("h-full w-full", navy ? "object-cover object-right" : "object-cover object-left")} />
        </div>
        <div className="p-5">
          <h1 className="text-[32px] font-bold leading-tight">{service.title}</h1>
          <p className={cn("mt-1 text-[15px]", navy ? "text-white/75" : "text-muted-foreground")}>{service.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="p-5">
          <h2 className="mb-1 text-[17px] font-semibold">Nueva solicitud</h2>
          <p className="mb-4 text-sm text-muted-foreground">{service.subtitle}</p>
          <CatalogCreateForm slug={slug} service={service} />
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
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
                <RequestsTable requests={ofType} slug={slug} currentEmployeeId={ctx.employee.id} canDecide exportable departments={departments.map((d) => d.name)} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
