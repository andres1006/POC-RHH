# Nexo RH — POC

Plataforma de RR. HH. multiempresa: Next.js 15 + Postgres (Drizzle) con aislamiento por empresa en la base (RLS).

## Arrancar en local
```bash
docker compose up -d db      # Postgres en localhost:5433
cp .env.example .env.local
pnpm install
pnpm db:migrate              # esquema + RLS
pnpm db:seed                 # empresas demo, solo si la base está vacía (--reset para recargar)
pnpm db:seed:eficacia        # agrega o reemplaza solo Eficacia
pnpm dev
```
Todo en contenedores: `docker compose up -d --build` → http://localhost:3100

## Cuentas demo
Contraseña `Demo1234!` (o los botones "Cuentas demo" del login).
- Andina: tomas.castro@andina.co (empleado), manuela.garcia@ (líder), carolina.henao@ (RR. HH.), sebastian.hernandez@ (admin)
- Café Montaña: valentina.salazar@cafemontana.co, tomas.arango@, sebastian.rojas@, natalia.restrepo@
- Eficacia: andres.agudelo@eficacia.com (admin). El resto de personas es ficticio, armado como fuerza de ventas, trade, contact center y sedes.

Nuevas empresas: `/registro`. Nuevas personas: Onboarding → Registrar ingreso, luego Configuración → Dar acceso (clave temporal).

## Arquitectura
- `src/server/services/*` — toda la lógica de negocio (recibe un `Ctx` con tenant y usuario).
- `src/app/api/v1/[tenant]/[...path]/route.ts` — API REST sobre esos servicios (cookie o `Authorization: Bearer`; token con `POST /api/v1/{empresa}/auth/login`). Es la frontera para extraer un backend propio.
- `src/server/actions.ts` — Server Actions de la web, llaman a los mismos servicios.
- `src/server/db/` — esquema Drizzle; `withTenant()` fija `app.tenant_id` y RLS filtra cada consulta. La app usa el rol `app_user` (sin BYPASSRLS).

No correr `pnpm build` con `pnpm dev` encendido: ambos escriben `.next`.
