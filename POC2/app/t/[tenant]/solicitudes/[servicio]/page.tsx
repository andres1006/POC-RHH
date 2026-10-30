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
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link href={`/t/${slug}/solicitudes`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Catálogo de servicios
      </Link>

      <div className={cn("overflow-hidden rounded-2xl border", navy && "bg-[#163E73] text-white")}>
        <div className={cn("relative h-28 sm:h-40 md:h-48", navy && "bg-[#163E73]")}>
          <img src={service.photo} alt="" className={cn("h-full w-full", navy ? "object-cover object-right" : "object-cover object-left")} />
        </div>
        <div className="p-4 sm:p-5">
          <h1 className="text-2xl font-bold leading-tight text-pretty sm:text-[32px]">{service.title}</h1>
          <p className={cn("mt-1 text-sm sm:text-[15px]", navy ? "text-white/75" : "text-muted-foreground")}>{service.description}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-6">
        <Card className="p-4 sm:p-5">
          <h2 className="mb-1 text-base font-semibold sm:text-[17px]">Nueva solicitud</h2>
          <p className="mb-4 text-sm text-muted-foreground">{service.subtitle}</p>
          <CatalogCreateForm slug={slug} service={service} />
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard label="En curso" value={kpi("pending")} icon={Clock} tone="warning" />
            <KpiCard label="Aprobadas" value={kpi("approved")} icon={CheckCircle2} tone="success" />
            <KpiCard label="Rechazadas" value={kpi("rejected")} icon={XCircle} tone="destructive" />
          </div>
          <Tabs defaultValue={defaultTab}>
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList className="mb-4 h-auto min-h-8 w-max">
                {isManagerRole(ctx.role) && (
                  <TabsTrigger value="approve" className="px-3">
                    Por aprobar {toApprove.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{toApprove.length}</span>}
                  </TabsTrigger>
                )}
                <TabsTrigger value="mine" className="px-3">
                  Mis solicitudes
                </TabsTrigger>
                {isHrRole(ctx.role) && (
                  <TabsTrigger value="all" className="px-3">
                    Todas
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
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
