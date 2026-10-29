import { getTenantContext } from "@/lib/tenant"
import { PageHeader } from "@/components/shared/page-header"
import { CatalogBrowser } from "@/components/requests/catalog-browser"

export const metadata = { title: "Catálogo de servicios" }

export default async function RequestsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  await getTenantContext(slug)
  return (
    <>
      <PageHeader title="Catálogo de servicios" description="Selecciona el servicio que quieres tramitar." />
      <CatalogBrowser slug={slug} />
    </>
  )
}
