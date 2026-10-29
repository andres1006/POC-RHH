import Link from 'next/link'
import { requireCtx } from '@/server/session'
import { changePasswordAction } from '@/server/actions'
import { ActionForm, Field } from '@/platform/action-form'
import { fullName } from '@/platform/format'
import { field } from '@/platform/ui'

// Fuera del layout (app): el layout redirige aquí a quien tiene clave temporal, así no hay bucle de redirecciones.
export default async function Cuenta({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const { tenant, user } = await requireCtx(slug)
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12" style={{ '--primary': tenant.primaryColor } as React.CSSProperties}>
      <div className="w-full max-w-sm">
        <span className="flex size-12 items-center justify-center rounded-[13px] bg-primary text-xl font-bold text-white" aria-hidden>{tenant.name[0]}</span>
        <h1 className="mt-5 text-[28px] font-bold leading-tight">{user.mustChangePassword ? `Hola, ${user.firstName}` : 'Cambiar contraseña'}</h1>
        <p className="mt-1 text-muted">{user.mustChangePassword ? 'Tu cuenta tiene una contraseña temporal. Crea una nueva para continuar.' : `${fullName(user)} · ${tenant.name}`}</p>
        <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <ActionForm action={changePasswordAction} tenant={slug} submit="Guardar contraseña" success="Contraseña actualizada">
            <Field label={user.mustChangePassword ? 'Contraseña temporal' : 'Contraseña actual'}><input type="password" name="current" required autoComplete="current-password" className={field} /></Field>
            <Field label="Nueva contraseña (mínimo 8 caracteres)"><input type="password" name="next" required minLength={8} autoComplete="new-password" className={field} /></Field>
          </ActionForm>
        </section>
        {!user.mustChangePassword && <Link href={`/${slug}`} className="mt-6 inline-block text-sm text-primary">← Volver</Link>}
      </div>
    </main>
  )
}
