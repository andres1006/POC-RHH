import { signOut } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export default function NoAccessPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">No tienes acceso a esta empresa</h1>
      <p className="max-w-md text-pretty text-muted-foreground">Tu usuario no tiene una membresía activa en esta empresa. Pide a RR. HH. que te agregue.</p>
      <form action={signOut}>
        <Button variant="outline">Cerrar sesión</Button>
      </form>
    </main>
  )
}
