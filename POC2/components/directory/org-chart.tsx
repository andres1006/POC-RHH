"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, Crosshair, Minus, Plus, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface OrgNode {
  id: string
  name: string
  position: string
  avatar_url: string | null
  manager_id: string | null
  department: string
}

export function OrgChart({ nodes, slug, currentId }: { nodes: OrgNode[]; slug: string; currentId: string }) {
  const byManager = useMemo(() => {
    const map = new Map<string | null, OrgNode[]>()
    for (const n of nodes) {
      const key = nodes.some((x) => x.id === n.manager_id) ? n.manager_id : null
      map.set(key, [...(map.get(key) ?? []), n])
    }
    return map
  }, [nodes])
  const parentOf = useMemo(() => new Map(nodes.map((n) => [n.id, n.manager_id])), [nodes])
  const roots = byManager.get(null) ?? []

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // Start with leaders' teams collapsed so the chart fits on screen.
    const s = new Set<string>()
    for (const n of nodes) {
      const depth = depthOf(n.id, parentOf)
      if (depth >= 2 && (byManager.get(n.id)?.length ?? 0) > 0) s.add(n.id)
    }
    return s
  })
  const [zoom, setZoom] = useState(1)
  const [q, setQ] = useState("")
  const [highlight, setHighlight] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const focus = (id: string) => {
    setCollapsed((s) => {
      const n = new Set(s)
      let p = parentOf.get(id) ?? null
      while (p) {
        n.delete(p)
        p = parentOf.get(p) ?? null
      }
      return n
    })
    setHighlight(id)
  }

  useEffect(() => {
    if (!highlight) return
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-node="${highlight}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
  }, [highlight, collapsed])

  const matches = q.trim() ? nodes.filter((n) => n.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar persona y centrar" className="pl-9" aria-label="Buscar persona" />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      focus(m.id)
                      setQ("")
                    }}
                  >
                    {m.name}
                    <span className="text-xs text-muted-foreground">{m.position}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} aria-label="Alejar">
            <Minus />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} aria-label="Acercar">
            <Plus />
          </Button>
          <Button variant="outline" size="sm" onClick={() => focus(currentId)}>
            <Crosshair /> Centrar en mí
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[65dvh] cursor-grab overflow-auto rounded-xl border bg-card active:cursor-grabbing"
        onPointerDown={(e) => {
          const el = containerRef.current
          if (!el || (e.target as HTMLElement).closest("a,button")) return
          dragging.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop }
        }}
        onPointerMove={(e) => {
          const el = containerRef.current
          if (!el || !dragging.current) return
          el.scrollLeft = dragging.current.sl - (e.clientX - dragging.current.x)
          el.scrollTop = dragging.current.st - (e.clientY - dragging.current.y)
        }}
        onPointerUp={() => (dragging.current = null)}
        onPointerLeave={() => (dragging.current = null)}
      >
        <div className="w-max min-w-full origin-top-left p-8" style={{ transform: `scale(${zoom})` }}>
          <ul className="flex justify-center gap-8">
            {roots.map((r) => (
              <TreeNode key={r.id} node={r} byManager={byManager} collapsed={collapsed} toggle={toggle} highlight={highlight} slug={slug} currentId={currentId} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function depthOf(id: string, parentOf: Map<string, string | null>) {
  let d = 0
  let p = parentOf.get(id) ?? null
  while (p && d < 20) {
    d++
    p = parentOf.get(p) ?? null
  }
  return d
}

function TreeNode({ node, byManager, collapsed, toggle, highlight, slug, currentId }: { node: OrgNode; byManager: Map<string | null, OrgNode[]>; collapsed: Set<string>; toggle: (id: string) => void; highlight: string | null; slug: string; currentId: string }) {
  const children = byManager.get(node.id) ?? []
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = children.length > 0

  return (
    <li className="flex flex-col items-center">
      <div
        data-node={node.id}
        className={cn(
          "relative flex w-52 flex-col items-center gap-1 rounded-xl border bg-background p-3 text-center shadow-sm transition-shadow",
          highlight === node.id && "ring-2 ring-primary",
          node.id === currentId && "border-primary/50",
        )}
      >
        <Avatar className="size-12">
          <AvatarImage src={node.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{node.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
        </Avatar>
        <Link href={`/t/${slug}/directorio/${node.id}`} className="text-sm font-medium leading-tight hover:underline">
          {node.name}
        </Link>
        <p className="text-xs leading-tight text-muted-foreground">{node.position}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{node.department}</p>
        {hasChildren && (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? "Expandir" : "Colapsar"} equipo de ${node.name}`}
            className="absolute -bottom-3 left-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 text-[11px] font-medium shadow-sm hover:bg-muted"
          >
            {children.length}
            <ChevronDown className={cn("size-3 transition-transform", !isCollapsed && "rotate-180")} aria-hidden />
          </button>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <>
          <span className="mt-3 h-6 w-px bg-border" aria-hidden />
          <ul className="relative flex gap-4 pt-4 before:absolute before:left-[calc(var(--edge)_/_2)] before:right-[calc(var(--edge)_/_2)] before:top-0 before:h-px before:bg-border" style={{ "--edge": "13rem" } as React.CSSProperties}>
            {children.map((c) => (
              <li key={c.id} className="relative flex flex-col items-center before:absolute before:-top-4 before:h-4 before:w-px before:bg-border">
                <ul className="flex">
                  <TreeNode node={c} byManager={byManager} collapsed={collapsed} toggle={toggle} highlight={highlight} slug={slug} currentId={currentId} />
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  )
}
