# PRD — "Nexo RH" · versión para v0 (Next.js + Supabase)

> Pega este documento completo en v0. Está escrito como especificación directa: pantallas, datos, roles y reglas. Construye todo en **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase** (Auth + Postgres + Storage).
> "Nexo RH" es un nombre provisional; deja el nombre, logo y colores configurables por empresa.

---

## 1. Contexto y objetivo
Plataforma SaaS de gestión humana (RR. HH.) **multiempresa** (multitenant) para Colombia/LatAm. Esta primera versión es un **prototipo navegable** para mostrar a líderes de negocio el camino del producto y conseguir aprobación. Debe verse como un producto terminado: datos de ejemplo realistas, flujos completos de punta a punta, móvil y escritorio.

**Referentes:** Buk (suite administrativa) y Humand (experiencia del colaborador). Tomar ideas de patrones, nunca copiar marca ni textos.

**Criterio de éxito del demo (5 minutos):**
1. Entro como **Empleado** → veo mi inicio, mi saldo de vacaciones y pido vacaciones.
2. Cambio a **Líder** → me llega el pendiente y lo apruebo.
3. Cambio a **RR. HH.** → veo el tablero de indicadores, el organigrama y el onboarding de un nuevo ingreso.
4. Cambio de **empresa** → cambian logo, colores y datos.

## 2. Usuarios y roles
| Rol | Qué hace |
|---|---|
| `employee` | Autoservicio: su ficha, solicitudes, documentos, beneficios, feed |
| `leader` | Todo lo de empleado + aprueba solicitudes de su equipo, ve su equipo y calendario de ausencias |
| `hr` | Gestiona personas, publica en el feed, configura tipos de solicitud, ve indicadores, onboarding |
| `admin` | Todo lo de RR. HH. + configuración de la empresa (marca, roles, módulos) |

Una persona tiene **un rol por empresa** (tabla `memberships`). Para el demo, agregar un **selector de rol y de empresa** visible en el header (solo en modo demo, `NEXT_PUBLIC_DEMO_MODE=true`) que inicia sesión automáticamente como un usuario semilla del rol elegido.

## 3. Multitenancy
- Cada empresa (`tenants`) tiene `slug`, `name`, `logo_url`, `primary_color`, `country`.
- Resolución del tenant por **subdominio** (`acme.app.com`) en `middleware.ts`; en local y en previews de v0 usar la ruta **`/t/[tenant]/...`** como fallback.
- Todas las tablas de negocio llevan `tenant_id uuid not null` y **Row Level Security** activo: un usuario solo ve filas de empresas donde tiene membresía.
- El color primario del tenant se inyecta como variable CSS (`--primary`) en el layout del tenant.

## 4. Navegación
- **Escritorio:** sidebar izquierda colapsable con grupos + topbar (buscador `⌘K`, botón ojo "ocultar datos sensibles", campana de pendientes, avatar con menú).
- **Móvil:** tab bar inferior: Inicio · Solicitudes · Beneficios · Pendientes · Menú.
- Grupos de la sidebar (se muestran según rol):
  - **Inicio:** Portal, Mi ficha, Directorio, Organigrama
  - **Gestión de RR. HH.:** Vacaciones y permisos, Documentos, Onboarding, Políticas
  - **Operaciones:** Solicitudes (workflows), Asistencia y turnos
  - **Talento:** Desempeño (9-box)
  - **Cultura:** Reconocimientos, Beneficios
  - **Analítica (hr/admin):** Tablero de indicadores
  - **Configuración (admin):** Empresa, Roles

## 5. Módulos y pantallas

### 5.1 Portal (Inicio) — todos
- Saludo "¡Buen día, {nombre}!" y fecha.
- **Columna principal — Feed:** publicaciones de RR. HH. (texto, imagen, autor, fecha, reacciones 👏❤️🎉, comentarios), tarjeta de **cumpleaños y aniversarios** de la semana, publicaciones de **reconocimiento**.
- **Columna derecha — Accesos directos:**
  - Tarjeta "Vacaciones disponibles": número grande (ej. `12,5 días`) + botón *Solicitar*.
  - Generar certificado · Solicitar permiso · Mis beneficios · Mis documentos pendientes de firma (con contador).
- Estado vacío ilustrado si no hay publicaciones.
- `hr`/`admin`: botón *Nueva publicación* (modal con texto, imagen, audiencia por área).

### 5.2 Mi ficha (perfil del colaborador)
- Tarjeta: avatar, nombre, cargo, área, badge de empresa, botón *Actualizar datos*.
- Acordeones: Información general · Previsión y pago (EPS, pensión, cesantías, banco — **ocultos** si el ojo está activo) · Atributos personalizados.
- Pestañas:
  - **Resumen:** cargo, supervisor, tipo de contrato, jornada, fecha de ingreso + antigüedad, saldo de vacaciones.
  - **Documentos:** filtro Todos/Pendientes, tabla (nombre, fecha, estado de firma, acciones Firmar/Descargar).
  - **Historia:** línea de tiempo de eventos laborales (Ingreso, Cambio de cargo, Cambio de salario) con "antes → después".
  - **Vacaciones:** saldo desglosado (acumuladas, tomadas, programadas, total), tabla de vacaciones tomadas con estado.
  - **Asistencia:** ausencias y horas extra del mes.
- *Actualizar datos* NO edita directo: crea una solicitud `data_change` que RR. HH. aprueba. Campos bloqueados: documento, correo corporativo, fecha de ingreso.

### 5.3 Vacaciones y permisos
- **Empleado:** formulario de vacaciones (tipo, fecha inicio, fecha fin, días hábiles calculados automáticamente excluyendo fines de semana y festivos de Colombia, comentario). Formulario de permiso (tipo: remunerado, no remunerado, cita médica, día de la familia, votación; por día u hora; media jornada; soporte adjunto).
- Mostrar "Estás solicitando N días" en vivo y validar contra saldo.
- **Líder:** **calendario de equipo** (vista mes, barras por persona con ausencias aprobadas y pendientes en otro tono) + lista de pendientes con *Aprobar* / *Rechazar (motivo)*.
- **RR. HH.:** tabla de todas las solicitudes con filtros por estado, área, tipo; exportar CSV.
- Al aprobar: el estado pasa a `approved`, se descuenta el saldo, se genera un documento "Solicitud de vacaciones" pendiente de firma del empleado y una notificación.

### 5.4 Solicitudes (motor de workflows)
- Todas las solicitudes (vacaciones, permiso, certificado, cambio de datos, genéricas) viven en **una sola tabla `requests`** con `type`, `payload jsonb`, `status` y pasos de aprobación en `request_steps`.
- Pantalla con tabs: *Mis pendientes por aprobar* · *Mis solicitudes* · *Todas* (hr). KPIs arriba: En curso, Aprobadas, Rechazadas.
- Tabla con filtros por columna (ID, título, tipo, solicitante, estado, progreso, fecha creación, fecha cierre).
- Detalle de solicitud en un **sheet lateral**: datos, línea de tiempo de aprobaciones, comentarios, acciones.
- *Nueva solicitud* abre un catálogo de tipos (cards con ícono).

### 5.5 Pendientes (campana)
Drawer lateral con chips por categoría: Todas · Aprobaciones · Firmas pendientes · Tareas de onboarding · Avisos. Estado vacío "¡Todo al día!".

### 5.6 Documentos y firma
- Plantillas (`document_templates`) por empresa: Certificado laboral, Certificado de antigüedad, Solicitud de vacaciones, Otrosí.
- Empleado: *Generar certificado* → elige plantilla → se crea documento (PDF de ejemplo en Storage) → si la plantilla requiere revisor, pasa por aprobación.
- **Firma simulada:** modal que muestra el PDF, checkbox "Acepto", código de 6 dígitos (en demo siempre `123456`), botón *Firmar*. Guarda `signed_at`.
- RR. HH.: envío masivo de un documento a varios colaboradores y reporte de firmas pendientes (barra de progreso).

### 5.7 Directorio y organigrama
- Directorio: grid/tabla con avatar, nombre, cargo, área, correo, botón ver ficha; buscador y filtros por área.
- **Organigrama interactivo:** árbol desde el CEO, nodos con avatar/nombre/cargo, expandir/colapsar, zoom y pan, buscar persona y centrar.

### 5.8 Onboarding
- RR. HH. crea un proceso de onboarding para un nuevo ingreso desde una plantilla de tareas (ej. "Firmar contrato", "Entregar equipo", "Curso de inducción", "Reunión con líder").
- Cada tarea tiene responsable (nuevo ingreso, líder, RR. HH., TI) y fecha límite.
- Vista del nuevo ingreso: checklist con progreso (%) y bienvenida.
- Vista RR. HH.: tablero con todos los ingresos en curso y su % de avance (barras), tareas vencidas en rojo.

### 5.9 Asistencia y turnos
- Empleado: botón grande *Marcar entrada / salida* con hora actual y ubicación simulada; historial de marcas de la semana.
- Líder/RR. HH.: **calendario semanal de turnos** por persona (bloques de color por turno: mañana, tarde, noche), alertas de atrasos y horas extra por aprobar.

### 5.10 Desempeño (9-box)
- Líder/RR. HH.: **matriz 9-box** (desempeño × potencial) con avatares arrastrables entre celdas; panel lateral con detalle de la persona.
- Empleado: sus objetivos con barra de avance y último resultado de evaluación.

### 5.11 Reconocimientos
- Dar un reconocimiento: elegir compañero, valor de la empresa (badges: Colaboración, Innovación, Servicio…), mensaje. Se publica en el feed.
- Ranking del mes.

### 5.12 Beneficios
- Marketplace: buscador, filtros por categoría con contador (Salud, Bienestar, Educación, Experiencias, Alimentación, Mascotas), cards con imagen, badge de descuento (%) y botón *Ver beneficio*; favoritos.

### 5.13 Tablero de indicadores (hr/admin)
KPIs en cards: headcount, ingresos y retiros del mes, rotación %, ausentismo %, solicitudes pendientes, firmas pendientes. Gráficos (Recharts): headcount por área (barras), evolución de headcount 12 meses (línea), distribución por tipo de contrato (dona), ausencias por mes (barras apiladas). Filtros por área y período.

### 5.14 Configuración (admin)
Marca de la empresa (nombre, logo, color primario con vista previa en vivo), módulos activos (switches), usuarios y roles (tabla con cambio de rol).

## 6. Modelo de datos (Supabase / Postgres)
Todas las tablas de negocio con `id uuid pk default gen_random_uuid()`, `tenant_id uuid not null references tenants`, `created_at timestamptz default now()`.

```
tenants(id, slug unique, name, logo_url, primary_color, country, modules jsonb)
profiles(id = auth.users.id, full_name, avatar_url, email)
memberships(user_id, tenant_id, role enum('employee','leader','hr','admin'), employee_id) unique(user_id, tenant_id)
departments(tenant_id, name, parent_id)
employees(tenant_id, user_id null, first_name, last_name, document_id, email, phone, position, department_id, manager_id → employees, hire_date, contract_type, workday, birth_date, avatar_url, status, sensitive jsonb)
employee_events(tenant_id, employee_id, type, occurred_at, changes jsonb)        -- historia
leave_balances(tenant_id, employee_id, accrued, taken, scheduled)
request_types(tenant_id, key, name, icon, schema jsonb, approval_flow jsonb)
requests(tenant_id, type_key, requester_id → employees, subject_id → employees, title, payload jsonb, status enum('draft','pending','approved','rejected','cancelled'), current_step int, closed_at)
request_steps(tenant_id, request_id, step int, approver_id → employees, status, comment, decided_at)
document_templates(tenant_id, name, requires_reviewer bool)
documents(tenant_id, employee_id, template_id, name, file_path, status enum('pending_signature','signed','rejected'), signed_at)
posts(tenant_id, author_id, kind enum('news','recognition','birthday'), body, image_url, audience jsonb)
post_reactions(tenant_id, post_id, employee_id, emoji)
recognitions(tenant_id, from_id, to_id, value, message)
onboarding_processes(tenant_id, employee_id, start_date, status)
onboarding_tasks(tenant_id, process_id, title, owner_role, assignee_id, due_date, done_at)
attendance_marks(tenant_id, employee_id, kind enum('in','out'), at, lat, lng)
shifts(tenant_id, employee_id, date, kind, starts_at, ends_at)
performance_reviews(tenant_id, employee_id, period, performance smallint 1-3, potential smallint 1-3)
benefits(tenant_id, name, category, discount_label, image_url, description)
notifications(tenant_id, recipient_id, kind, title, link, read_at)
holidays(country, date, name)
```

**RLS (ejemplo para todas las tablas con tenant_id):**
```sql
create function public.is_member(t uuid) returns boolean language sql stable security definer as
$$ select exists(select 1 from memberships where user_id = auth.uid() and tenant_id = t) $$;
alter table employees enable row level security;
create policy tenant_read on employees for select using (public.is_member(tenant_id));
```
Escrituras sensibles (aprobar, cambiar roles) solo por **Server Actions** que validan rol con una función `current_role(tenant_id)`.

## 7. Datos semilla
- **2 empresas:** "Andina Logística" (azul `#2563EB`, 48 personas) y "Café Montaña" (verde `#16A34A`, 25 personas).
- Áreas: Dirección, Operaciones, Comercial, Tecnología, Finanzas, Gestión Humana.
- Organigrama de 3–4 niveles, nombres colombianos realistas, avatares generados (iniciales o DiceBear).
- 4 usuarios demo por empresa, uno por rol. El empleado demo reporta al líder demo.
- 15 solicitudes en distintos estados, 6 publicaciones en el feed, 3 onboardings en curso, 12 beneficios, turnos de 2 semanas, 9-box completo del equipo del líder, festivos de Colombia del año.

## 8. Diseño
- Estilo limpio tipo SaaS moderno: fondo gris muy claro, cards blancas con borde sutil y radio 12px, tipografía Inter, íconos Lucide.
- Color primario por empresa; colores semánticos fijos (éxito, advertencia, error).
- Tablas con filtros por columna, paginación y selector de columnas.
- Estados vacíos con ilustración, skeletons de carga, toasts al confirmar acciones.
- Modo oscuro.
- Responsive completo; móvil con tab bar inferior.
- Accesible: foco visible, labels en todos los inputs, contraste AA.
- Idioma: español (Colombia). Fechas `dd/mm/aaaa`, moneda COP.

## 9. Fuera de alcance (v1 del prototipo)
Nómina real, PILA/DIAN, firma electrónica con validez legal, integraciones externas, app móvil nativa, correo real, IA. Mostrar algunos como "Próximamente" en el menú para comunicar visión.

## 10. Criterios de aceptación
- [ ] El flujo empleado pide vacaciones → líder aprueba → saldo baja → documento queda pendiente de firma → empleado firma, funciona sin recargar datos a mano.
- [ ] Cambiar de empresa cambia logo, color y todos los datos; un usuario de una empresa nunca ve datos de otra (RLS).
- [ ] El menú y las acciones cambian según el rol.
- [ ] Todas las pantallas funcionan en 375px de ancho.
- [ ] El ojo oculta salario, documento y datos de previsión en toda la app.
