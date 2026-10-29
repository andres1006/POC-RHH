"use client"

import Image from "next/image"
import { useOptimistic, useTransition } from "react"
import { Award, Cake, Newspaper } from "lucide-react"
import type { Post } from "@/lib/types"
import { toggleReaction } from "@/lib/actions"
import { formatDateTime, fullName } from "@/lib/format"
import { EmployeeAvatar } from "@/components/shared/employee-avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const REACTIONS = [
  { key: "clap", glyph: "👏", label: "Aplauso" },
  { key: "heart", glyph: "❤️", label: "Me encanta" },
  { key: "party", glyph: "🎉", label: "Celebrar" },
]

const KIND: Record<Post["kind"], { label: string; icon: typeof Newspaper }> = {
  news: { label: "Comunicado", icon: Newspaper },
  recognition: { label: "Reconocimiento", icon: Award },
  birthday: { label: "Celebraciones", icon: Cake },
}

export function Feed({ posts, slug, currentEmployeeId }: { posts: Post[]; slug: string; currentEmployeeId: string }) {
  if (posts.length === 0) {
    return <EmptyState icon={Newspaper} title="Aún no hay publicaciones" description="Cuando Gestión Humana publique novedades, aparecerán aquí." />
  }
  return (
    <div className="flex flex-col gap-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} slug={slug} currentEmployeeId={currentEmployeeId} />
      ))}
    </div>
  )
}

function PostCard({ post, slug, currentEmployeeId }: { post: Post; slug: string; currentEmployeeId: string }) {
  const [, startTransition] = useTransition()
  const [reactions, setReactions] = useOptimistic(post.reactions ?? [], (state, emoji: string) => {
    const mine = state.find((r) => r.emoji === emoji && r.employee_id === currentEmployeeId)
    return mine ? state.filter((r) => r !== mine) : [...state, { emoji, employee_id: currentEmployeeId }]
  })
  const kind = KIND[post.kind]

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-center gap-3 px-5 pt-5">
        <EmployeeAvatar person={post.author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fullName(post.author)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {post.author?.position} · {formatDateTime(post.created_at)}
          </p>
        </div>
        <Badge variant={post.kind === "recognition" ? "default" : "secondary"} className="gap-1">
          <kind.icon className="size-3" aria-hidden /> {kind.label}
        </Badge>
      </header>
      <p className="px-5 py-4 text-sm leading-relaxed text-pretty">{post.body}</p>
      {post.image_url && (
        <div className="relative aspect-[16/8] w-full">
          <Image src={post.image_url} alt="" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
        </div>
      )}
      <footer className="flex items-center gap-2 px-5 py-3">
        {REACTIONS.map((r) => {
          const count = reactions.filter((x) => x.emoji === r.key).length
          const mine = reactions.some((x) => x.emoji === r.key && x.employee_id === currentEmployeeId)
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={mine}
              aria-label={`${r.label}${count ? `, ${count}` : ""}`}
              onClick={() =>
                startTransition(async () => {
                  setReactions(r.key)
                  await toggleReaction(slug, post.id, r.key)
                })
              }
              className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted", mine && "border-primary/40 bg-primary/10 text-primary")}
            >
              <span aria-hidden>{r.glyph}</span>
              {count > 0 && <span className="tabular-nums">{count}</span>}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground">Comentar</span>
      </footer>
    </Card>
  )
}
