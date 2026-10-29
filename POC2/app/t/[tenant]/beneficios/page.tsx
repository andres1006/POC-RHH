import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Gift } from "lucide-react"
import { getBenefits } from "@/lib/data"
import { getTenantContext, moduleOn } from "@/lib/tenant"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { cn } from "@/lib/utils"

export const metadata = { title: "Beneficios" }

interface Benefit {
  id: string
  name: string
  category: string
  discount_label: string | null
  image_url: string | null
  description: string | null
}

export default async function BenefitsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { tenant: slug } = await params
  const { cat } = await searchParams
  const ctx = await getTenantContext(slug)
  if (!moduleOn(ctx.tenant, "benefits")) notFound()

  const benefits = (await getBenefits(ctx.tenant.id)) as Benefit[]
  const categories = [...new Set(benefits.map((b) => b.category))]
  const shown = benefits.filter((b) => !cat || b.category === cat)
  const base = `/t/${slug}/beneficios`

  return (
    <>
      <PageHeader title="Beneficios" description={`Convenios y descuentos que ${ctx.tenant.name} tiene para ti.`} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={base} className={chip(!cat)} scroll={false}>
          Todos <span className="opacity-60">{benefits.length}</span>
        </Link>
        {categories.map((category) => (
          <Link key={category} href={`${base}?cat=${encodeURIComponent(category)}`} className={chip(cat === category)} scroll={false}>
            {category} <span className="opacity-60">{benefits.filter((b) => b.category === category).length}</span>
          </Link>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={Gift} title="Sin beneficios en esta categoría" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((benefit) => (
            <article key={benefit.id} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="relative h-36 bg-muted">
                {benefit.image_url && (
                  <Image src={benefit.image_url} alt="" fill className="object-cover" sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" />
                )}
                {benefit.discount_label && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">{benefit.discount_label}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">{benefit.category}</p>
                <h2 className="font-medium">{benefit.name}</h2>
                {benefit.description && <p className="text-sm text-muted-foreground text-pretty">{benefit.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function chip(active: boolean) {
  return cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", active ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10 hover:bg-muted")
}
