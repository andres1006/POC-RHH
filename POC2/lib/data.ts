import { createClient } from "@/lib/supabase/server"
import type { DocumentRow, Employee, EmployeeLite, LeaveBalance, Notification, Post, RequestRow } from "@/lib/types"

const EMP_LITE = "id, first_name, last_name, avatar_url, position, department:departments(name)"

export async function getPosts(tenantId: string): Promise<Post[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(`id, kind, body, image_url, created_at, author:employees(${EMP_LITE}), reactions:post_reactions(emoji, employee_id)`)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  return (data ?? []) as unknown as Post[]
}

export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const supabase = await createClient()
  const { data } = await supabase.from("leave_balances").select("accrued, taken, scheduled").eq("employee_id", employeeId).maybeSingle()
  return {
    accrued: Number(data?.accrued ?? 0),
    taken: Number(data?.taken ?? 0),
    scheduled: Number(data?.scheduled ?? 0),
  }
}

export { availableDays } from "@/lib/data-helpers"

export async function getEmployees(tenantId: string): Promise<Employee[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("employees")
    .select("*, department:departments(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("last_name")
  return (data ?? []) as Employee[]
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("employees").select("*, department:departments(name)").eq("id", id).maybeSingle()
  return data as Employee | null
}

export async function getDepartments(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("departments").select("id, name, parent_id").eq("tenant_id", tenantId).order("name")
  return data ?? []
}

export async function getTeam(managerId: string): Promise<EmployeeLite[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("employees").select(EMP_LITE).eq("manager_id", managerId).eq("status", "active").order("last_name")
  return (data ?? []) as unknown as EmployeeLite[]
}

export async function getRequests(tenantId: string, filter?: { requesterId?: string; approverId?: string }): Promise<RequestRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("requests")
    .select(
      `id, type_key, requester_id, subject_id, title, payload, status, current_step, closed_at, created_at,
       requester:employees!requests_requester_id_fkey(${EMP_LITE}),
       steps:request_steps(id, step, approver_id, status, comment, decided_at, approver:employees(${EMP_LITE}))`,
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (filter?.requesterId) query = query.eq("requester_id", filter.requesterId)
  const { data } = await query
  let rows = (data ?? []) as unknown as RequestRow[]
  if (filter?.approverId) {
    rows = rows.filter((r) => r.steps?.some((s) => s.approver_id === filter.approverId))
  }
  return rows
}

export async function getDocuments(tenantId: string, employeeId?: string): Promise<DocumentRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("documents")
    .select(`id, employee_id, name, file_path, status, signed_at, created_at, employee:employees(${EMP_LITE})`)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (employeeId) query = query.eq("employee_id", employeeId)
  const { data } = await query
  return (data ?? []) as unknown as DocumentRow[]
}

export async function getDocumentTemplates(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("document_templates").select("id, name, requires_reviewer").eq("tenant_id", tenantId).order("name")
  return data ?? []
}

export async function getNotifications(employeeId: string): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, link, read_at, created_at")
    .eq("recipient_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(30)
  return (data ?? []) as Notification[]
}

export async function getHolidays(country = "CO"): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("holidays").select("date").eq("country", country)
  return (data ?? []).map((h) => h.date as string)
}

export async function getEmployeeEvents(employeeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("employee_events")
    .select("id, type, occurred_at, changes")
    .eq("employee_id", employeeId)
    .order("occurred_at", { ascending: false })
  return data ?? []
}

export async function getOnboarding(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("onboarding_processes")
    .select(
      `id, start_date, status, employee:employees(${EMP_LITE}, hire_date),
       tasks:onboarding_tasks(id, title, owner_role, assignee_id, due_date, done_at)`,
    )
    .eq("tenant_id", tenantId)
    .order("start_date", { ascending: false })
  return data ?? []
}

export async function getAttendance(employeeId: string, from: Date) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("attendance_marks")
    .select("id, kind, at, lat, lng")
    .eq("employee_id", employeeId)
    .gte("at", from.toISOString())
    .order("at", { ascending: false })
  return data ?? []
}

export async function getTodayMarks(tenantId: string, fromIso: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("attendance_marks")
    .select(`id, kind, at, employee_id, employee:employees(${EMP_LITE})`)
    .eq("tenant_id", tenantId)
    .gte("at", fromIso)
    .order("at", { ascending: false })
  return data ?? []
}

export async function getShifts(tenantId: string, from: string, to: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("shifts")
    .select(`id, date, kind, starts_at, ends_at, employee:employees(${EMP_LITE})`)
    .eq("tenant_id", tenantId)
    .gte("date", from)
    .lte("date", to)
    .order("date")
  return data ?? []
}

export async function getPerformance(tenantId: string, employeeIds?: string[]) {
  const supabase = await createClient()
  let query = supabase
    .from("performance_reviews")
    .select(`id, employee_id, period, performance, potential, employee:employees(${EMP_LITE})`)
    .eq("tenant_id", tenantId)
    .eq("period", "2026-H1")
  if (employeeIds) query = query.in("employee_id", employeeIds)
  const { data } = await query
  return data ?? []
}

export async function getRecognitions(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("recognitions")
    .select(`id, value, message, created_at, from:employees!recognitions_from_id_fkey(${EMP_LITE}), to:employees!recognitions_to_id_fkey(${EMP_LITE})`)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getBenefits(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("benefits").select("*").eq("tenant_id", tenantId).order("category")
  return data ?? []
}

export async function getMemberships(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("memberships")
    .select(`id, role, user_id, employee:employees(${EMP_LITE}, email)`)
    .eq("tenant_id", tenantId)
  return data ?? []
}

export async function getRequestTypes(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("request_types").select("key, name, icon, approval_flow").eq("tenant_id", tenantId)
  return data ?? []
}
