import Link from "next/link"
import { PartyPopper } from "lucide-react"
import { getTenantContext } from "@/lib/tenant"
import { getNotifications } from "@/lib/data"
import { formatDateTime } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card } from "@/components/ui/card"

export const metadata = { title: "Pendientes" }

export default async function PendingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  const notifications = await getNotifications(ctx.employee.id)

  return (
    <>
      <PageHeader title="Pendientes" description="Aprobaciones, firmas, tareas y avisos." />
      {notifications.length === 0 ? (
        <EmptyState icon={PartyPopper} title="¡Todo al día!" />
      ) : (
        <Card className="divide-y p-0">
          {notifications.map((n) => (
            <Link key={n.id} href={n.link ?? `/t/${slug}`} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/60">
              <span className={`text-sm ${n.read_at ? "" : "font-medium"}`}>{n.title}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
            </Link>
          ))}
        </Card>
      )}
    </>
  )
}
