import { Download, FileCheck2, FileClock } from 'lucide-react'
import { requireCtx } from '@/server/session'
import { listMyDocuments, policyReport } from '@/server/services/documents'
import { generateCertificate, signDocument } from '@/server/actions'
import { can } from '@/platform/rbac'
import { ActionForm, Field } from '@/platform/action-form'
import { Badge, Card, CardTitle, Empty, PageHeader, Segmented, btn, field, fmtDate } from '@/platform/ui'

const DOC_STATUS = {
  pending_signature: { label: 'Por firmar', tone: 'warning' },
  signed: { label: 'Firmado', tone: 'success' },
  issued: { label: 'Emitido', tone: 'primary' },
} as const

export default async function Documentos({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { tenant: slug } = await params
  const ctx = await requireCtx(slug)
  const tab = (await searchParams).tab === 'pendientes' ? 'pendientes' : 'todos'
  const isHr = can(ctx.user.role, 'people.read_all')
  const [mine, report] = await Promise.all([listMyDocuments(ctx), isHr ? policyReport(ctx) : Promise.resolve([])])
  const pending = mine.filter((d) => d.status === 'pending_signature')
  const rows = tab === 'pendientes' ? pending : mine

  return (
    <div className="space-y-6">
      <PageHeader title="Documentos" subtitle="Tus contratos, certificados y documentos por firmar" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0 p-0">
          <div className="border-b border-line p-3">
            <Segmented active={tab} items={[{ key: 'todos', label: 'Todos', href: '?tab=todos' }, { key: 'pendientes', label: `Por firmar (${pending.length})`, href: '?tab=pendientes' }]} />
          </div>
          {rows.length === 0 ? <Empty title="¡Todo firmado!" text="No tienes documentos pendientes" /> : (
            <ul className="divide-y divide-line">
              {rows.map((d) => (
                <li key={d.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {d.status === 'pending_signature' ? <FileClock className="size-5 text-amber-600" aria-hidden /> : <FileCheck2 className="size-5 text-primary" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted">{d.kind} · {fmtDate(d.createdAt)}{d.signedAt && ` · firmado ${fmtDate(d.signedAt)}`}</p>
                    </div>
                    <Badge tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Badge>
                    <a href={`/api/v1/${slug}/documents/${d.id}/pdf`} target="_blank" rel="noopener" className={btn.tinted}><Download className="size-3.5" aria-hidden /> PDF</a>
                  </div>
                  {d.status === 'pending_signature' && (
                    <details className="mt-3 rounded-xl bg-bg p-4">
                      <summary className={`${btn.tinted} cursor-pointer list-none`}>Firmar documento</summary>
                      <div className="mt-4 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
                        <p className="font-medium text-fg">{d.name}</p>
                        <p className="mt-2">Declaro que he leído y acepto el contenido de este documento. Esta firma electrónica simple tiene validez conforme a la Ley 527 de 1999.</p>
                      </div>
                      <ActionForm action={signDocument} tenant={slug} hidden={{ id: d.id }} submit="Firmar" success="Documento firmado" className="mt-4">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="accept" className="size-4 accent-[var(--primary)]" /> Acepto el contenido</label>
                        <Field label="Código de verificación (demo: 123456)">
                          <input name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className={`${field} max-w-40 tracking-[0.4em]`} />
                        </Field>
                      </ActionForm>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Generar certificado</CardTitle>
            <div className="space-y-2">
              {[['laboral', 'Certificado laboral'], ['antiguedad', 'Certificado de antigüedad'], ['ingresos', 'Ingresos y retenciones']].map(([k, label]) => (
                <form key={k} action={generateCertificate}>
                  <input type="hidden" name="tenant" value={slug} />
                  <input type="hidden" name="kind" value={k} />
                  <button className="flex w-full items-center justify-between rounded-xl bg-bg px-4 py-3 text-left text-sm hover:bg-fill">{label} <span className="text-primary">Generar</span></button>
                </form>
              ))}
            </div>
          </Card>
          {isHr && report.length > 0 && (
            <Card>
              <CardTitle>Firmas: Política de datos 2026</CardTitle>
              <ul className="space-y-3 text-sm">
                {report.map((a) => (
                  <li key={a.area}>
                    <div className="mb-1 flex justify-between"><span>{a.area}</span><span className="tabular-nums text-muted">{a.signed}/{a.total}</span></div>
                    <div className="h-1.5 rounded-full bg-fill"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(a.signed / Math.max(a.total, 1)) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
