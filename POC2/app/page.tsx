import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserTenants } from "@/lib/tenant"
import { DEMO_MODE } from "@/lib/demo"
import { DemoLauncher } from "@/components/demo/demo-launcher"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const tenants = await getUserTenants()
    if (tenants[0]) redirect(`/t/${tenants[0].tenant.slug}`)
    redirect("/sin-acceso")
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Prototipo navegable · Next.js + Supabase
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Eficacia RH: la gestión humana de tu empresa en un solo lugar
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Autoservicio del colaborador, aprobaciones, documentos con firma, onboarding, asistencia, desempeño e indicadores. Multiempresa, en
          español y pensado para Colombia y LatAm.
        </p>
      </header>

      {DEMO_MODE ? (
        <DemoLauncher />
      ) : (
        <Button render={<Link href="/auth/login" />} nativeButton={false} className="w-fit">
          Iniciar sesión
        </Button>
      )}

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link href="/auth/login" className="hover:text-foreground">
          Entrar con correo y contraseña
        </Link>
        <span>Código de firma en demo: 123456</span>
      </footer>
    </main>
  )
}
