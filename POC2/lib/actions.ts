"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getTenantContext, isHrRole, isManagerRole } from "@/lib/tenant"
import { DEMO_MODE, DEMO_SIGN_CODE, demoEmail } from "@/lib/demo"
import type { Role } from "@/lib/types"

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "NexoDemo2026!"

type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

// ---------- Auth ----------

export async function switchDemoUser(slug: string, role: Role) {
  if (!DEMO_MODE) redirect("/auth/login")
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { error } = await supabase.auth.signInWithPassword({ email: demoEmail(slug, role), password: DEMO_PASSWORD })
  if (error) redirect(`/auth/login?error=demo`)
  redirect(`/t/${slug}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function loginWithPassword(_: unknown, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "")
  if (!email || !password) return fail("Ingresa tu correo y contraseña.")
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes("confirm")) return fail("Debes confirmar tu correo antes de ingresar.")
    if (error.status === 429) return fail("Demasiados intentos. Espera un momento.")
    return fail("Correo o contraseña incorrectos.")
  }
  redirect(next && next.startsWith("/") ? next : "/")
}

export async function setSensitiveHidden(hidden: boolean) {
  const store = await cookies()
  store.set("nexo_hide_sensitive", hidden ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
}

// ---------- Helpers ----------

async function resolveApprover(tenantId: string, requesterId: string, flow: "leader" | "hr") {
  const supabase = await createClient()
  if (flow === "leader") {
    const { data } = await supabase.from("employees").select("manager_id").eq("id", requesterId).single()
    if (data?.manager_id) return data.manager_id as string
  }
  const { data: hr } = await supabase.from("memberships").select("employee_id").eq("tenant_id", tenantId).in("role", ["hr", "admin"]).limit(1).maybeSingle()
  return (hr?.employee_id as string) ?? null
}

async function notify(tenantId: string, recipientId: string | null, kind: string, title: string, link: string) {
  if (!recipientId) return
  const supabase = await createClient()
  await supabase.from("notifications").insert({ tenant_id: tenantId, recipient_id: recipientId, kind, title, link })
}

// ---------- Requests ----------

export async function createRequest(
  slug: string,
  input: { type_key: string; title: string; payload: Record<string, unknown>; flow?: "leader" | "hr" },
): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const flow = input.flow ?? (["certificate", "data_change"].includes(input.type_key) ? "hr" : "leader")

  if (input.type_key === "vacation") {
    const days = Number(input.payload.days ?? 0)
    const { data: bal } = await supabase.from("leave_balances").select("accrued, taken, scheduled").eq("employee_id", ctx.employee.id).maybeSingle()
    const available = Number(bal?.accrued ?? 0) - Number(bal?.taken ?? 0) - Number(bal?.scheduled ?? 0)
    if (days <= 0) return fail("Selecciona al menos un día hábil.")
    if (days > available) return fail(`Solo tienes ${available} días disponibles.`)
  }

  const approverId = await resolveApprover(ctx.tenant.id, ctx.employee.id, flow)
  const { data: req, error } = await supabase
    .from("requests")
    .insert({
      tenant_id: ctx.tenant.id,
      type_key: input.type_key,
      requester_id: ctx.employee.id,
      subject_id: ctx.employee.id,
      title: input.title,
      payload: input.payload,
      status: "pending",
    })
    .select("id")
    .single()
  if (error || !req) return fail("No se pudo crear la solicitud.")

  await supabase.from("request_steps").insert({ tenant_id: ctx.tenant.id, request_id: req.id, step: 1, approver_id: approverId, status: "pending" })
  await notify(ctx.tenant.id, approverId, "approval", `${ctx.employee.first_name} ${ctx.employee.last_name}: ${input.title}`, `/t/${slug}/solicitudes`)

  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: "Solicitud enviada. Te avisaremos cuando sea revisada." }
}

export async function decideRequest(slug: string, requestId: string, decision: "approved" | "rejected", comment?: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!isManagerRole(ctx.role)) return fail("No tienes permisos para aprobar solicitudes.")
  const supabase = await createClient()

  const { data: req } = await supabase
    .from("requests")
    .select("id, type_key, title, requester_id, payload, status, steps:request_steps(id, approver_id, status)")
    .eq("id", requestId)
    .eq("tenant_id", ctx.tenant.id)
    .single()
  if (!req || req.status !== "pending") return fail("La solicitud ya fue procesada.")

  const step = (req.steps as { id: string; approver_id: string | null; status: string }[]).find((s) => s.status === "pending")
  const isApprover = step?.approver_id === ctx.employee.id
  if (!isApprover && !isHrRole(ctx.role)) return fail("Esta solicitud no está asignada a ti.")

  const now = new Date().toISOString()
  if (step) {
    await supabase.from("request_steps").update({ status: decision, comment: comment ?? null, decided_at: now, approver_id: step.approver_id ?? ctx.employee.id }).eq("id", step.id)
  }
  await supabase.from("requests").update({ status: decision, closed_at: now }).eq("id", req.id)

  if (decision === "approved" && req.type_key === "vacation") {
    const payload = req.payload as { days?: number; start_date?: string }
    const days = Number(payload.days ?? 0)
    const { data: bal } = await supabase.from("leave_balances").select("id, taken, scheduled").eq("employee_id", req.requester_id).maybeSingle()
    if (bal) {
      const future = payload.start_date ? new Date(payload.start_date) > new Date() : false
      await supabase
        .from("leave_balances")
        .update(future ? { scheduled: Number(bal.scheduled) + days } : { taken: Number(bal.taken) + days })
        .eq("id", bal.id)
    }
    const { data: tpl } = await supabase.from("document_templates").select("id").eq("tenant_id", ctx.tenant.id).eq("name", "Solicitud de vacaciones").maybeSingle()
    await supabase.from("documents").insert({
      tenant_id: ctx.tenant.id,
      employee_id: req.requester_id,
      template_id: tpl?.id ?? null,
      name: `Solicitud de vacaciones — ${req.title}`,
      file_path: "/docs/sample.pdf",
      status: "pending_signature",
    })
    await notify(ctx.tenant.id, req.requester_id, "signature", "Firma tu solicitud de vacaciones aprobada", `/t/${slug}/documentos`)
  }

  await notify(
    ctx.tenant.id,
    req.requester_id,
    "notice",
    `Tu solicitud "${req.title}" fue ${decision === "approved" ? "aprobada" : "rechazada"}`,
    `/t/${slug}/solicitudes`,
  )

  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: decision === "approved" ? "Solicitud aprobada." : "Solicitud rechazada." }
}

export async function cancelRequest(slug: string, requestId: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const { error } = await supabase
    .from("requests")
    .update({ status: "cancelled", closed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requester_id", ctx.employee.id)
    .eq("status", "pending")
  if (error) return fail("No se pudo cancelar.")
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: "Solicitud cancelada." }
}

// ---------- Documents ----------

export async function signDocument(slug: string, documentId: string, code: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (code !== DEMO_SIGN_CODE) return fail("Código incorrecto. En la demo el código es 123456.")
  const supabase = await createClient()
  const { error } = await supabase
    .from("documents")
    .update({ status: "signed", signed_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("employee_id", ctx.employee.id)
    .eq("status", "pending_signature")
  if (error) return fail("No se pudo firmar el documento.")
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: "Documento firmado correctamente." }
}

export async function generateCertificate(slug: string, templateId: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const { data: tpl } = await supabase.from("document_templates").select("id, name, requires_reviewer").eq("id", templateId).single()
  if (!tpl) return fail("Plantilla no encontrada.")

  if (tpl.requires_reviewer) {
    return createRequest(slug, { type_key: "certificate", title: tpl.name, payload: { template_id: tpl.id }, flow: "hr" })
  }
  const { error } = await supabase.from("documents").insert({
    tenant_id: ctx.tenant.id,
    employee_id: ctx.employee.id,
    template_id: tpl.id,
    name: tpl.name,
    file_path: "/docs/sample.pdf",
    status: "signed",
    signed_at: new Date().toISOString(),
  })
  if (error) return fail("No se pudo generar el documento.")
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: `${tpl.name} generado. Ya puedes descargarlo.` }
}

export async function sendBulkDocument(slug: string, name: string, employeeIds: string[]): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!isHrRole(ctx.role)) return fail("Solo RR. HH. puede enviar documentos masivos.")
  if (!name.trim() || employeeIds.length === 0) return fail("Indica el nombre y al menos un colaborador.")
  const supabase = await createClient()
  const rows = employeeIds.map((employee_id) => ({ tenant_id: ctx.tenant.id, employee_id, name: name.trim(), file_path: "/docs/sample.pdf", status: "pending_signature" as const }))
  const { error } = await supabase.from("documents").insert(rows)
  if (error) return fail("No se pudieron enviar los documentos.")
  await supabase.from("notifications").insert(employeeIds.map((employee_id) => ({ tenant_id: ctx.tenant.id, recipient_id: employee_id, kind: "signature", title: `Nuevo documento para firmar: ${name}`, link: `/t/${slug}/documentos` })))
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: `Documento enviado a ${employeeIds.length} colaboradores.` }
}

// ---------- Feed ----------

export async function createPost(slug: string, body: string, imageUrl: string | null, audience: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!isHrRole(ctx.role)) return fail("Solo RR. HH. puede publicar.")
  if (!body.trim()) return fail("Escribe el contenido de la publicación.")
  const supabase = await createClient()
  const { error } = await supabase.from("posts").insert({
    tenant_id: ctx.tenant.id,
    author_id: ctx.employee.id,
    kind: "news",
    body: body.trim(),
    image_url: imageUrl || null,
    audience: audience === "all" ? { all: true } : { department: audience },
  })
  if (error) return fail("No se pudo publicar.")
  revalidatePath(`/t/${slug}`)
  return { ok: true, message: "Publicación creada." }
}

export async function toggleReaction(slug: string, postId: string, emoji: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const { data: existing } = await supabase.from("post_reactions").select("id").eq("post_id", postId).eq("employee_id", ctx.employee.id).eq("emoji", emoji).maybeSingle()
  if (existing) await supabase.from("post_reactions").delete().eq("id", existing.id)
  else await supabase.from("post_reactions").insert({ tenant_id: ctx.tenant.id, post_id: postId, employee_id: ctx.employee.id, emoji })
  revalidatePath(`/t/${slug}`)
  return { ok: true }
}

// ---------- Recognitions ----------

export async function giveRecognition(slug: string, toId: string, value: string, message: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!toId || !value) return fail("Elige un compañero y un valor.")
  const supabase = await createClient()
  const { data: to } = await supabase.from("employees").select("first_name, last_name").eq("id", toId).single()
  const { error } = await supabase.from("recognitions").insert({ tenant_id: ctx.tenant.id, from_id: ctx.employee.id, to_id: toId, value, message })
  if (error) return fail("No se pudo enviar el reconocimiento.")
  await supabase.from("posts").insert({
    tenant_id: ctx.tenant.id,
    author_id: ctx.employee.id,
    kind: "recognition",
    body: `Reconocimiento a ${to?.first_name} ${to?.last_name} — ${value}. ${message}`.trim(),
  })
  await notify(ctx.tenant.id, toId, "notice", `${ctx.employee.first_name} te envió un reconocimiento: ${value}`, `/t/${slug}/reconocimientos`)
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: "Reconocimiento publicado en el feed." }
}

// ---------- Onboarding ----------

export async function toggleOnboardingTask(slug: string, taskId: string, done: boolean): Promise<ActionResult> {
  await getTenantContext(slug)
  const supabase = await createClient()
  const { error } = await supabase.from("onboarding_tasks").update({ done_at: done ? new Date().toISOString() : null }).eq("id", taskId)
  if (error) return fail("No se pudo actualizar la tarea.")
  revalidatePath(`/t/${slug}/onboarding`)
  return { ok: true }
}

export async function createOnboarding(slug: string, employeeId: string, startDate: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!isHrRole(ctx.role)) return fail("Solo RR. HH. puede crear onboardings.")
  const supabase = await createClient()
  const { data: emp } = await supabase.from("employees").select("manager_id").eq("id", employeeId).single()
  const { data: proc, error } = await supabase
    .from("onboarding_processes")
    .insert({ tenant_id: ctx.tenant.id, employee_id: employeeId, start_date: startDate, status: "in_progress" })
    .select("id")
    .single()
  if (error || !proc) return fail("No se pudo crear el proceso.")
  const start = new Date(startDate)
  const plus = (d: number) => new Date(start.getTime() + d * 86400000).toISOString().slice(0, 10)
  const template = [
    { title: "Firmar contrato", owner_role: "new_hire", assignee_id: employeeId, due_date: plus(0) },
    { title: "Afiliación a seguridad social", owner_role: "hr", assignee_id: ctx.employee.id, due_date: plus(-1) },
    { title: "Entregar equipo de cómputo", owner_role: "it", assignee_id: null, due_date: plus(0) },
    { title: "Configurar correo y accesos", owner_role: "it", assignee_id: null, due_date: plus(0) },
    { title: "Reunión con líder", owner_role: "leader", assignee_id: emp?.manager_id ?? null, due_date: plus(2) },
    { title: "Curso de inducción", owner_role: "new_hire", assignee_id: employeeId, due_date: plus(5) },
  ]
  await supabase.from("onboarding_tasks").insert(template.map((t) => ({ ...t, tenant_id: ctx.tenant.id, process_id: proc.id })))
  revalidatePath(`/t/${slug}/onboarding`)
  return { ok: true, message: "Onboarding creado con la plantilla de tareas." }
}

// ---------- Attendance ----------

export async function markAttendance(slug: string, kind: "in" | "out"): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  const { error } = await supabase.from("attendance_marks").insert({
    tenant_id: ctx.tenant.id,
    employee_id: ctx.employee.id,
    kind,
    lat: 4.710989 + (Math.random() - 0.5) * 0.002,
    lng: -74.072092 + (Math.random() - 0.5) * 0.002,
  })
  if (error) return fail("No se pudo registrar la marca.")
  revalidatePath(`/t/${slug}/asistencia`)
  return { ok: true, message: kind === "in" ? "Entrada registrada." : "Salida registrada." }
}

// ---------- Performance ----------

export async function movePerformance(slug: string, employeeId: string, performance: number, potential: number): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (!isManagerRole(ctx.role)) return fail("Sin permisos.")
  const supabase = await createClient()
  const { error } = await supabase
    .from("performance_reviews")
    .upsert({ tenant_id: ctx.tenant.id, employee_id: employeeId, period: "2026-H1", performance, potential }, { onConflict: "employee_id,period" })
  if (error) return fail("No se pudo mover a la persona.")
  revalidatePath(`/t/${slug}/desempeno`)
  return { ok: true }
}

// ---------- Notifications ----------

export async function markAllNotificationsRead(slug: string): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  const supabase = await createClient()
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", ctx.employee.id).is("read_at", null)
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true }
}

// ---------- Admin ----------

export async function updateTenantBrand(slug: string, input: { name: string; primary_color: string; logo_url: string; modules: Record<string, boolean> }): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (ctx.role !== "admin") return fail("Solo el administrador puede cambiar la marca.")
  if (!/^#[0-9a-fA-F]{6}$/.test(input.primary_color)) return fail("El color debe ser hexadecimal (#RRGGBB).")
  const supabase = await createClient()
  const { error } = await supabase
    .from("tenants")
    .update({ name: input.name.trim(), primary_color: input.primary_color, logo_url: input.logo_url || null, modules: input.modules })
    .eq("id", ctx.tenant.id)
  if (error) return fail("No se pudo guardar.")
  revalidatePath(`/t/${slug}`, "layout")
  return { ok: true, message: "Configuración guardada." }
}

export async function updateMemberRole(slug: string, membershipId: string, role: Role): Promise<ActionResult> {
  const ctx = await getTenantContext(slug)
  if (ctx.role !== "admin") return fail("Solo el administrador puede cambiar roles.")
  const supabase = await createClient()
  const { error } = await supabase.from("memberships").update({ role }).eq("id", membershipId).eq("tenant_id", ctx.tenant.id)
  if (error) return fail("No se pudo cambiar el rol.")
  revalidatePath(`/t/${slug}/configuracion`)
  return { ok: true, message: "Rol actualizado." }
}
