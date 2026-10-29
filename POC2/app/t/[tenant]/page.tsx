import Link from "next/link"
import { Award, FileSignature, FileText, Gift, Newspaper, Palmtree, Clock } from "lucide-react"
import { getTenantContext, isHrRole } from "@/lib/tenant"
import { availableDays, getDepartments, getDocuments, getEmployees, getLeaveBalance, getPosts } from "@/lib/data"
import { formatDays, formatLongDate } from "@/lib/format"
import { Feed } from "@/components/portal/feed"
import { CelebrationsCard } from "@/components/portal/celebrations-card"
import { NewPostDialog } from "@/components/portal/new-post-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function PortalPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const [posts, balance, docs, employees, departments] = await Promise.all([
    getPosts(ctx.tenant.id),
    getLeaveBalance(ctx.employee.id),
    getDocuments(ctx.tenant.id, ctx.employee.id),
    getEmployees(ctx.tenant.id),
    getDepartments(ctx.tenant.id),
  ])
  const pendingSign = docs.filter((d) => d.status === "pending_signature").length
  const base = `/t/${slug}`
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buen día" : hour < 18 ? "Buenas tardes" : "Buenas noches"

  const shortcuts = [
    { label: "Generar certificado", href: `${base}/documentos?generar=1`, icon: FileText },
    { label: "Solicitar permiso", href: `${base}/vacaciones?tab=permiso`, icon: Clock },
    { label: "Mis beneficios", href: `${base}/beneficios`, icon: Gift },
    { label: "Reconocer a un compañero", href: `${base}/reconocimientos?nuevo=1`, icon: Award },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            ¡{greeting}, {ctx.employee.first_name}!
          </h1>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatLongDate()}</p>
        </div>
        {isHrRole(ctx.role) && <NewPostDialog slug={slug} departments={departments} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-label="Feed" className="order-2 flex flex-col gap-4 lg:order-1">
          <CelebrationsCard employees={employees} />
          <Feed posts={posts} slug={slug} currentEmployeeId={ctx.employee.id} />
        </section>

        <aside className="order-1 flex flex-col gap-4 lg:order-2">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Palmtree className="size-4 text-primary" aria-hidden /> Vacaciones disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-semibold tabular-nums tracking-tight">
                  {formatDays(availableDays(balance))}
                  <span className="ml-1 text-base font-normal text-muted-foreground">días</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDays(balance.taken)} tomados · {formatDays(balance.scheduled)} programados
                </p>
              </div>
              <Button render={<Link href={`${base}/vacaciones?nuevo=1`} />} nativeButton={false} size="sm">
                Solicitar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accesos directos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-2 pt-0">
              <Link href={`${base}/documentos`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                <FileSignature className="size-4 text-primary" aria-hidden />
                <span className="flex-1">Documentos pendientes de firma</span>
                {pendingSign > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{pendingSign}</span>}
              </Link>
              {shortcuts.map((s) => (
                <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                  <s.icon className="size-4 text-primary" aria-hidden />
                  <span className="flex-1">{s.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="hidden lg:block">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
              <Newspaper className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="text-pretty">Las publicaciones de Gestión Humana y los reconocimientos de tus compañeros aparecen en el feed.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
