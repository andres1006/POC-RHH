import { notFound } from "next/navigation"
import { Rocket } from "lucide-react"
import { getEmployees, getOnboarding } from "@/lib/data"
import { isHrRole, moduleOn, getTenantContext } from "@/lib/tenant"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { OnboardingBoard, type OnboardingPerson, type OnboardingProcess, type OnboardingTask } from "@/components/onboarding/onboarding-board"

export const metadata = { title: "Onboarding" }

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function OnboardingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const ctx = await getTenantContext(slug)
  if (!moduleOn(ctx.tenant, "onboarding")) notFound()

  const [raw, employees] = await Promise.all([getOnboarding(ctx.tenant.id), isHrRole(ctx.role) ? getEmployees(ctx.tenant.id) : Promise.resolve([])])
  const processes: OnboardingProcess[] = raw.map((row) => {
    const record = row as {
      id: string
      start_date: string
      status: string
      employee: OnboardingPerson | OnboardingPerson[] | null
      tasks: OnboardingTask[] | null
    }
    return {
      id: record.id,
      start_date: record.start_date,
      status: record.status,
      employee: one(record.employee),
      tasks: [...(record.tasks ?? [])].sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
    }
  })

  const busy = new Set(processes.filter((p) => p.status !== "completed").map((p) => p.employee?.id).filter(Boolean))
  const candidates = employees.filter((e) => !busy.has(e.id))

  return (
    <>
      <PageHeader title="Onboarding" description="Que cada persona nueva llegue con contrato, accesos y equipo listos desde el primer día." />
      <OnboardingBoard slug={slug} processes={processes} candidates={candidates} canCreate={isHrRole(ctx.role)} />
      {processes.length === 0 && (
        <div className="mt-6">
          <EmptyState icon={Rocket} title="No hay procesos de ingreso" description="Cuando RR. HH. abra un onboarding, las tareas aparecen aquí." />
        </div>
      )}
    </>
  )
}
