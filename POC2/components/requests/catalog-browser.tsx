"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, Search } from "lucide-react"
import { SERVICE_CATEGORIES, SERVICES, type ServiceItem } from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function CatalogBrowser({ slug }: { slug: string }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<(typeof SERVICE_CATEGORIES)[number]>("Todas")
  const [view, setView] = useState<"grid" | "list">("grid")
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()
    return SERVICES.filter(
      (s) =>
        (cat === "Todas" || s.category === cat) &&
        (!query || `${s.title} ${s.subtitle} ${s.description}`.toLowerCase().includes(query)),
    )
  }, [q, cat])

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:pt-1">
        <p className="mb-2 text-[13px] font-semibold text-muted-foreground">Categorías</p>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Categorías de servicios">
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-left text-[13px] font-medium transition lg:rounded-[10px]",
                cat === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold">Servicios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona el servicio que quieres tramitar. Puedes buscarlo por nombre o filtrar por una de las categorías disponibles.
            </p>
          </div>
          <div className="flex rounded-[9px] bg-muted p-0.5" role="group" aria-label="Vista">
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn("rounded-[7px] p-1.5", view === "grid" ? "bg-background shadow-sm" : "text-muted-foreground")}
              aria-label="Vista de tarjetas"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn("rounded-[7px] p-1.5", view === "list" ? "bg-background shadow-sm" : "text-muted-foreground")}
              aria-label="Vista de lista"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-[10px] border bg-card px-3 py-2 text-sm text-muted-foreground">
          <Search className="size-4" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servicio"
            className="w-full bg-transparent text-foreground outline-none"
            aria-label="Buscar servicio"
          />
        </label>
        <p className="mb-3 text-sm font-medium">{cat}</p>
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No hay servicios con ese filtro</p>
        ) : view === "grid" ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((s) => (
              <li key={s.id}>
                <ServiceCard slug={slug} s={s} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {shown.map((s) => (
              <li key={s.id}>
                <Link href={`/t/${slug}/solicitudes/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
                  <img src={s.photo} alt="" className="size-12 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.title}</span>
                    <span className="block text-sm text-muted-foreground">{s.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ slug, s }: { slug: string; s: ServiceItem }) {
  const navy = s.variant === "navy"
  return (
    <Link
      href={`/t/${slug}/solicitudes/${s.id}`}
      className="block h-full overflow-hidden rounded-[18px] border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:shadow-md"
    >
      <div className={cn("relative h-[132px] overflow-hidden", navy && "bg-[#163E73]")}>
        <img src={s.photo} alt="" className={cn("h-full w-full", navy ? "object-cover object-right" : "object-cover object-left")} />
        {s.variant !== "muted" && (
          <p
            className={cn(
              "pointer-events-none absolute inset-y-0 right-3 flex max-w-[62%] items-center text-right text-[22px] font-bold leading-tight",
              navy ? "text-white" : "text-primary",
            )}
          >
            {s.title}
          </p>
        )}
      </div>
      <div className={cn("p-4", navy && "bg-[#163E73] text-white")}>
        <h3 className="font-semibold">{s.variant === "muted" ? s.title : s.subtitle}</h3>
        <p className={cn("mt-1 text-sm", navy ? "text-white/75" : "text-muted-foreground")}>{s.description}</p>
      </div>
    </Link>
  )
}
