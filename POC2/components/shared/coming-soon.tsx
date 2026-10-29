import { Sparkles } from "lucide-react"
import { PageHeader } from "./page-header"
import { EmptyState } from "./empty-state"

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Sparkles} title="Próximamente" description={description} />
    </>
  )
}
