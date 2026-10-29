# Benchmark Buk — vista de empleado

Recorrido completo del portal de un tenant real de Buk con perfil **empleado** (2026-10-29).
Solo estructura, campos y patrones de UI. Sin datos personales ni nombre del cliente. No se envió, firmó ni modificó nada.

## Multitenancy
- Un subdominio por empresa: `{tenant}.buk.co`. Rutas internas idénticas entre tenants → el tenant sale del host.
- Login con marca del cliente (logo + fondo). Paso 1 solo pide correo; paso 2 depende del método del tenant (SSO / contraseña).
- Datos configurables por tenant: tipos de permiso, plantillas de documento, catálogo de procesos, beneficios, nombre del grupo de comunidad, atributos personalizados de ficha.

## Navegación (desktop)
- **Topbar:** buscador global `Ctrl+K` · ícono de portal · 👁 mostrar/ocultar datos sensibles · campana → drawer **Mis pendientes** · ayuda (centro de soporte, capacitaciones) · avatar.
- **Rail lateral** con 3 secciones que despliegan un panel:
  1. **Inicio:** Portal · Mi ficha · Mis beneficios · Directorio
  2. **Administrativo:** grupo de comunidad de la empresa → Solicitudes · Ejecuciones · Mis solicitudes · Actualizar datos
  3. **Buk Studio** (workflows y agentes IA) — con *product tour* de primera vez ("Ver después" / "Siguiente")
- **Móvil:** tab bar inferior Feed · Accesos · Beneficios · Tareas · Menú; header "¡Buen día! {nombre}".

## Pantallas

### Portal `/static_pages/portal`
- Columna principal: **feed** (anuncios, cumpleaños, noticias). Vacío → ilustración "¡Nos emociona que formes parte de esto!".
- Columna derecha **Accesos directos** (con badge de empresa):
  - Vacaciones disponibles (saldo grande + *Solicitar*)
  - Generar certificado o documento → modal
  - Solicitar permiso → modal
  - Beneficios

### Mi ficha `/employees/:id`
- **Tarjeta izquierda:** avatar, nombre, cargo, badge de empresa, botón *Actualizar datos*; acordeones *Información general* · *Previsión y pago* · *Atributos personalizados*.
- **Pestañas:**
  | Pestaña | Contenido |
  |---|---|
  | Resumen | Cargo, compañía, supervisor, tipo de contrato, jornada (horas y días), fecha de ingreso (antigüedad), saldo de vacaciones |
  | Documentos | Filtros Todos / Pendientes; tabla (nombre, fecha creación, acciones firmar / descargar / comentarios); *Solicitar documento*; carpetas |
  | Historia | **Timeline** por secciones (*Trabajos*, *Planes*): eventos *Ingreso* / *Modificación* con duración y diff "antes → después" (p. ej. EPS, fondo de pensión, cesantías) |
  | Bitácora | Filtro por procedencia + editor rich text para comentarios sobre el empleado; estado vacío ilustrado |
  | Asistencia ▾ | Ausencias · Horas extra y recargos (no cargó en el recorrido) |
  | Vacaciones | Saldo a una fecha (asumidas, compensadas, tomadas, futuras, **total**) · *Vacaciones tomadas* (inicio, término, días, tipo, estado *Aprobada*, firmar/ver) · *Acumuladas* por período · *Compensadas* |

### Solicitar vacaciones `/employees/:id/vacacions/new`
Saldo disponible vs. legales → tipo de vacaciones (p. ej. *Legales*) → fechas → *Solicitar*. Genera un PDF que el empleado **firma**.

### Solicitar permiso (modal)
Tipo de ausencia (*no remunerado, remunerado, por votación, día de la familia*) · medida de tiempo (*por día / por hora*) · fecha inicio · media jornada (inicio/final) · contador "Estás solicitando N días" · documento soporte · comentario.

### Generar documento (modal)
Tipo de documento (plantilla, p. ej. *Certificado de antigüedad*) · revisor configurado en la plantilla (p. ej. supervisor) · *Solicitar documento*. Link a *Mis documentos*.

### Actualizar datos `/employees/:id/profile_modifier_requests/...`
Formulario por secciones (Información general, Atributos personalizados) con campos bloqueados (identificación, correo corporativo, fecha de ingreso) y editables (teléfono, dirección, cumpleaños con opción de hacerlo público, foto, etnia). Botón *Siguiente* → **queda como solicitud que RR. HH. aprueba**.

### Mis beneficios `/benefits`
Tabs Todos / Suscripciones · buscador · filtro por categoría con contadores (fitness, salud, conocimiento, seguros, servicios, experiencias, sabores, shopping, mascotas) · *Mis favoritos* · grid de cards con imagen, badge de descuento (%) y categoría. Es un **marketplace de convenios**.

### Directorio `/employees/directorio`
Tabla con avatar: nombre, cargo, división, área, sub-área, teléfono, email; filtro por columna y paginación.

### Solicitudes / Ejecuciones / Mis solicitudes (motor de workflows)
- Tabs *Mis pendientes / Mis solicitudes / Todas* (o *Pendientes / Iniciados por mí*).
- **Ejecuciones:** KPIs en cards (en curso, aprobados, con error, rechazados) + tabs Todos / En curso / Con error / Finalizadas.
- Tabla con filtros por columna: ID, título, estado, proceso, tipo, iniciado por, colaborador afectado, nº documento, progreso, fechas creación/cierre. Exportar, *Acciones*, selector de columnas.
- *Crear solicitud / Crear ejecución* → catálogo de procesos que define RR. HH. (vacío para este perfil).

### Mis pendientes (drawer de la campana)
Selector Pendientes (n) · categorías en chips: *Todas · Solicitud de ausentismo · Avisos · Firma pendiente · Tareas de onboarding* · estado vacío "¡Muy bien! Nada por el momento".

## Patrones para el prototipo
1. **Todo es una solicitud con aprobación** (vacaciones, permisos, documentos, cambio de datos, procesos) → un solo motor de workflows con bandeja de pendientes.
2. **Documento + firma electrónica** como cierre de cada trámite.
3. **Saldo de vacaciones siempre visible** con CTA.
4. **Timeline de historia laboral** con diff antes → después.
5. **Toggle de datos sensibles** (ojo) y campos bloqueados vs. editables.
6. **Drawer de pendientes** por categoría desde la campana.
7. Marketplace de beneficios con filtros y badges de descuento.
8. Estados vacíos ilustrados, *product tours* de primera vez.
9. Branding y catálogos configurables por tenant.

## No visible con perfil empleado
Vistas de líder (aprobar), RR. HH. y admin (nómina, configuración de tenant, plantillas, analytics, publicación en feed). Se cubren con el benchmark de landings ([benchmark-landings.md](benchmark-landings.md)).
