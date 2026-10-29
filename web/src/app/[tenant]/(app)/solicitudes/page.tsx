import { requireCtx } from '@/server/session'
import { PageHeader } from '@/platform/ui'
import { CatalogBrowser } from '@/modules/requests/catalog-browser'

export default async function Solicitudes({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  await requireCtx(slug)
  return (
    <div>
      <PageHeader title="Catálogo de servicios" subtitle="Selecciona el servicio que quieres tramitar." />
      <CatalogBrowser tenant={slug} />
    </div>
  )
}
