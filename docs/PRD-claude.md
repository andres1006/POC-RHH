# PRD técnico — Nexo RH · versión base escalable (construida por Claude)

El **alcance funcional** (roles, módulos, pantallas, datos semilla, criterios de aceptación) es el mismo de [PRD-v0.md](PRD-v0.md). Este documento define **cómo** se construye para que la POC sea la base del producto real y no un desechable.

## 1. Principios
1. **Monolito modular**: un solo deploy de Next.js, dividido por dominios con fronteras claras. Se parte en servicios solo cuando un dominio lo exija (nómina, por carga o regulación).
2. **Reglas de negocio puras y probadas**: cálculo de días hábiles, saldos, motor de aprobaciones y permisos son funciones sin I/O, con tests.
3. **Multitenant desde el día 1**: cada fila lleva `tenant_id`; el aislamiento lo garantiza la base de datos (RLS), no solo el código.
4. **Un solo motor de solicitudes**: vacaciones, permisos, certificados, cambio de datos y procesos futuros son `requests` con pasos de aprobación.
5. **Datos detrás de una capa de consultas por módulo**: la POC usa un store en memoria con semilla; pasar a Postgres cambia solo `server/queries.ts` y `server/actions.ts` de cada módulo, no la UI.

## 2. Stack
| Capa | Elección | Por qué |
|---|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript estricto | RSC + Server Actions: menos API boilerplate, SEO irrelevante pero streaming útil |
| UI | Tailwind CSS v4 + componentes propios estilo shadcn (Radix) + Lucide | Theming por variables CSS → color por tenant gratis |
| Gráficos | Recharts | Suficiente para KPIs |
| Validación | Zod | Mismo esquema en formulario y Server Action |
| BD (fase 2) | Postgres (Supabase o Neon) + **Drizzle ORM** | Tipos de extremo a extremo, migraciones versionadas, no amarra a un proveedor |
| Auth (fase 2) | Supabase Auth (o Auth.js) con SSO por tenant | Login en 2 pasos: correo → método del tenant |
| Archivos | Supabase Storage / S3 con prefijo `tenant_id/` | |
| Jobs (fase 2) | Cola (Inngest / pg-boss) | Acumulación mensual de vacaciones, recordatorios, envíos masivos |
| Tests | Vitest (reglas de dominio) + Playwright (flujo demo) | |
| Deploy | Vercel (wildcard `*.dominio.com`) | |

## 3. Multitenancy
- **Resolución:** `middleware.ts` lee el host. `acme.nexorh.com` o `acme.localhost:3000` → reescribe a `/acme/...`. También se acepta la ruta directa `/acme/...` (previews, entornos sin wildcard).
- **Contexto:** el segmento `app/[tenant]` carga el tenant una vez (`getTenant(slug)`, cacheado) y lo pasa por props/contexto; 404 si no existe.
- **Theming:** el layout del tenant inyecta `--primary` desde `tenants.primary_color`.
- **Aislamiento en BD (fase 2):** esquema compartido + `tenant_id` + RLS. Cada transacción ejecuta `select set_config('app.tenant_id', $1, true), set_config('app.user_id', $2, true)` y las políticas usan `current_setting('app.tenant_id')::uuid`. Funciona igual con Drizzle sobre cualquier Postgres.
- **Escala:** índices compuestos `(tenant_id, …)` en todas las tablas; si un cliente grande lo exige, se mueve a su propia base cambiando solo el *connection resolver* por tenant.

## 4. Estructura del proyecto
```
src/
  middleware.ts                 # subdominio → /[tenant]
  app/
    page.tsx                    # selector de empresa (demo)
    [tenant]/
      layout.tsx                # carga tenant, theming, shell (sidebar/topbar/tabbar)
      page.tsx                  # Portal
      perfil/[id]/page.tsx      # Mi ficha / ficha de colaborador
      vacaciones/page.tsx
      solicitudes/page.tsx
      directorio/page.tsx
      organigrama/page.tsx
      onboarding/page.tsx
      asistencia/page.tsx
      desempeno/page.tsx
      reconocimientos/page.tsx
      beneficios/page.tsx
      indicadores/page.tsx
      configuracion/page.tsx
  platform/                     # transversal, sin dominio de negocio
    tenant.ts                   # getTenant, tipos
    session.ts                  # usuario actual (demo: cookie; fase 2: auth)
    rbac.ts                     # can(role, permission) + navegación por rol
    store/                      # POC: store en memoria + semilla (globalThis)
    ui/                         # botones, cards, tabla, badge, sheet, avatar…
  modules/
    people/        domain/ server/ ui/
    leave/         domain/ (businessDays, balance) server/ ui/
    requests/      domain/ (motor de aprobaciones) server/ ui/
    documents/     …
    feed/          …
    onboarding/    …
    attendance/    …
    performance/   …
    benefits/      …
    analytics/     …
```
Regla de dependencias: `app → modules → platform`. Un módulo no importa la UI de otro; si necesita datos de otro, usa su `server/queries.ts`.

## 5. Dominio clave

### 5.1 Motor de solicitudes
```ts
type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
type Step = { approverId: string; status: 'pending'|'approved'|'rejected'; decidedAt?: string; comment?: string }
type HrRequest = { id; tenantId; type: 'vacation'|'permission'|'certificate'|'data_change'; requesterId; payload; status; steps: Step[]; createdAt; closedAt? }
decide(request, approverId, 'approve'|'reject', comment?) → HrRequest   // pura, lanza error si no le toca
```
- El flujo de aprobación por tipo se define en datos (`request_types.approval_flow`: `['manager']`, `['manager','hr']`…), resuelto a personas al crear la solicitud.
- Efectos al aprobar (descontar saldo, generar documento, notificar) se ejecutan en la Server Action tras `decide`, dentro de la misma transacción (fase 2) → fase 3 se mueven a eventos de dominio.

### 5.2 Vacaciones (Colombia)
- 15 días hábiles por año trabajado, acumulación proporcional diaria.
- `businessDays(from, to, holidays)` excluye sábados, domingos y festivos.
- Saldo = acumuladas − tomadas − programadas; no se permite solicitar más que el saldo.

### 5.3 RBAC
Permisos atómicos (`requests.approve`, `people.read_sensitive`, `feed.publish`, `analytics.view`, `tenant.configure`) asignados a roles en un mapa estático; fase 2 se vuelven configurables por tenant. La navegación se deriva de los permisos, no de `if (role === …)` dispersos.

## 6. Modelo de datos
Igual a la sección 6 de [PRD-v0.md](PRD-v0.md), escrito como esquema Drizzle en fase 2, con:
- `tenant_id` en todas las tablas de negocio + índice compuesto.
- Auditoría: `created_by`, `updated_at`; tabla `audit_log(tenant_id, actor_id, action, entity, entity_id, diff jsonb, at)` alimentada desde las Server Actions.
- Datos sensibles (salario, cuenta bancaria, documento) en columnas aparte, solo legibles con `people.read_sensitive` (vista o política RLS de columna).

## 7. Seguridad
- Toda mutación es una Server Action que: valida entrada con Zod → obtiene sesión → verifica permiso → ejecuta con tenant del contexto (nunca del body).
- RLS como segunda barrera.
- Archivos con URLs firmadas de corta duración.
- Ley 1581 de 2012 (habeas data, Colombia): consentimiento, finalidad, derecho de consulta; logs de acceso a datos sensibles.

## 8. Fases
| Fase | Entrega | Datos |
|---|---|---|
| **0 — POC (ahora)** | Shell multitenant + roles demo, Portal, Mi ficha, Vacaciones (pedir → aprobar → saldo), Solicitudes, Pendientes, Directorio, Organigrama, Indicadores; luego Onboarding, Asistencia, 9-box, Beneficios, Reconocimientos | Store en memoria con semilla |
| 1 — MVP | Postgres + Drizzle + RLS, Auth real, Storage, firma simple, notificaciones por correo | Real |
| 2 — Producto | Constructor de flujos, plantillas configurables, jobs, integraciones (nómina externa), app móvil (PWA) | |
| 3 — Escala | Eventos de dominio, búsqueda (Postgres FTS → Typesense), analítica en réplica, IA (asistente del colaborador) | |

## 9. Calidad
- `tsc --noEmit` y `next build` limpios.
- Tests Vitest para `businessDays`, `leaveBalance`, `decide`, `can`.
- Playwright: flujo del demo (empleado pide → líder aprueba → saldo baja).
- Accesibilidad AA, responsive 375px.
