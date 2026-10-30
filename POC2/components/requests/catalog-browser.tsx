"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, Search } from "lucide-react"
import { SERVICES, type ServiceItem } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Todas", ...new Set(SERVICES.map((s) => s.category))] as const

export function CatalogBrowser({ slug }: { slug: string }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todas")
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
    <div className="grid gap-5 lg:grid-cols-[200px_1fr] lg:gap-8">
      <aside>
        <p className="mb-2 text-[13px] font-semibold text-muted-foreground">Categorías</p>
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:px-0" aria-label="Categorías de servicios">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-left text-[13px] font-medium transition lg:w-full lg:rounded-[10px]",
                cat === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold sm:text-[22px]">Servicios</h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Elige el trámite. Filtra por categoría o búscalo por nombre.
            </p>
          </div>
          <div className="flex w-fit rounded-[9px] bg-muted p-0.5" role="group" aria-label="Vista">
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
        <label className="mb-4 flex items-center gap-2 rounded-[10px] border bg-card px-3 py-2.5 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servicio"
            className="w-full min-w-0 bg-transparent text-foreground outline-none"
            aria-label="Buscar servicio"
          />
        </label>
        <p className="mb-3 text-sm font-medium">{cat}</p>
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No hay servicios con ese filtro</p>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
                <Link href={`/t/${slug}/solicitudes/${s.id}`} className="flex items-center gap-3 px-3 py-3 sm:px-4 hover:bg-muted">
                  <img src={s.photo} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{s.subtitle}</span>
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
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:shadow-md"
    >
      <div className={cn("relative h-28 overflow-hidden sm:h-[132px]", navy && "bg-[#163E73]")}>
        <img src={s.photo} alt="" className={cn("h-full w-full", navy ? "object-cover object-right" : "object-cover object-left")} />
        {s.variant !== "muted" && (
          <p
            className={cn(
              "pointer-events-none absolute inset-y-0 right-2 hidden max-w-[58%] items-center text-right text-lg font-bold leading-tight sm:flex sm:right-3 sm:text-[22px]",
              navy ? "text-white" : "text-primary",
            )}
          >
            {s.title}
          </p>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col p-3.5 sm:p-4", navy && "bg-[#163E73] text-white")}>
        <h3 className="text-sm font-semibold text-pretty sm:text-base">{s.title}</h3>
        <p className={cn("mt-0.5 text-xs", navy ? "text-white/70" : "text-muted-foreground")}>{s.subtitle}</p>
        <p className={cn("mt-1.5 line-clamp-2 text-sm", navy ? "text-white/80" : "text-muted-foreground")}>{s.description}</p>
      </div>
    </Link>
  )
}
