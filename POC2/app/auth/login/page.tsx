import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Iniciar sesión" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <LoginForm next={next} initialError={error === "demo" ? "No se pudo iniciar la sesión de demo. Intenta de nuevo." : undefined} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  )
}
