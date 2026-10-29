import Link from "next/link"
import { notFound } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { BrandForm } from "@/components/settings/brand-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Empresa" }

export default async function SettingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (ctx.role !== "admin") notFound()

  return (
    <>
      <PageHeader
        title="Empresa"
        description="Nombre, color y módulos que ve el equipo."
        actions={
          <Button variant="outline" render={<Link href={`/t/${slug}/configuracion/roles`} />} nativeButton={false}>
            Roles y accesos
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm
            slug={slug}
            initial={{
              name: ctx.tenant.name,
              primary_color: ctx.tenant.primary_color,
              logo_url: ctx.tenant.logo_url ?? "",
              modules: ctx.tenant.modules ?? {},
            }}
          />
        </CardContent>
      </Card>
    </>
  )
}
