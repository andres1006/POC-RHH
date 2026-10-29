import Link from 'next/link'
import { requireCtx } from '@/server/session'
import { listEmployees, type Employee } from '@/server/services/people'
import { fullName } from '@/platform/format'
import { Avatar, PageHeader } from '@/platform/ui'

function Node({ e, all, slug, depth }: { e: Employee; all: Employee[]; slug: string; depth: number }) {
  const reports = all.filter((x) => x.managerId === e.id)
  const card = (
    <Link href={`/${slug}/perfil/${e.id}`} className="inline-flex w-56 min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left hover:border-primary">
      <Avatar name={fullName(e)} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{fullName(e)}</span>
        <span className="block truncate text-xs text-muted">{e.position}</span>
      </span>
    </Link>
  )
  if (!reports.length) return <li className="py-1">{card}</li>
  return (
    <li className="py-1">
      <details open={depth < 1}>
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          {card}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary" aria-label={`${reports.length} personas a cargo`}>{reports.length}</span>
        </summary>
        <ul className="ml-7 border-l border-line pl-6">
          {reports.map((r) => <Node key={r.id} e={r} all={all} slug={slug} depth={depth + 1} />)}
        </ul>
      </details>
    </li>
  )
}

export default async function Organigrama({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const all = await listEmployees(ctx)
  const roots = all.filter((e) => !e.managerId || !all.some((m) => m.id === e.managerId))
  return (
    <div>
      <PageHeader title="Organigrama" subtitle="Haz clic en el número para expandir un equipo" />
      <ul className="overflow-x-auto pb-4">{roots.map((r) => <Node key={r.id} e={r} all={all} slug={slug} depth={0} />)}</ul>
    </div>
  )
}
