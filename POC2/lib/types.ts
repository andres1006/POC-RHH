export type Role = "employee" | "leader" | "hr" | "admin"
export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled"
export type DocumentStatus = "pending_signature" | "signed" | "rejected"

export interface Tenant {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string
  country: string
  modules: Record<string, boolean>
}

export interface Employee {
  id: string
  tenant_id: string
  user_id: string | null
  first_name: string
  last_name: string
  document_id: string | null
  email: string | null
  phone: string | null
  position: string | null
  department_id: string | null
  manager_id: string | null
  hire_date: string | null
  contract_type: string | null
  workday: string | null
  birth_date: string | null
  avatar_url: string | null
  status: string
  sensitive: {
    salary?: number
    eps?: string
    pension?: string
    cesantias?: string
    bank?: string
    account?: string
  }
  department?: { name: string } | null
}

export type EmployeeLite = Pick<Employee, "id" | "first_name" | "last_name" | "avatar_url" | "position"> & {
  department?: { name: string } | null
}

export interface Department {
  id: string
  name: string
  parent_id: string | null
}

export interface LeaveBalance {
  accrued: number
  taken: number
  scheduled: number
}

export interface RequestRow {
  id: string
  type_key: string
  requester_id: string
  subject_id: string | null
  title: string
  payload: Record<string, unknown>
  status: RequestStatus
  current_step: number
  closed_at: string | null
  created_at: string
  requester?: EmployeeLite | null
  steps?: RequestStep[]
}

export interface RequestStep {
  id: string
  step: number
  approver_id: string | null
  status: string
  comment: string | null
  decided_at: string | null
  approver?: EmployeeLite | null
}

export interface DocumentRow {
  id: string
  employee_id: string
  name: string
  file_path: string | null
  status: DocumentStatus
  signed_at: string | null
  created_at: string
  employee?: EmployeeLite | null
}

export interface Post {
  id: string
  kind: "news" | "recognition" | "birthday"
  body: string
  image_url: string | null
  created_at: string
  author?: EmployeeLite | null
  reactions?: { emoji: string; employee_id: string }[]
}

export interface Notification {
  id: string
  kind: string
  title: string
  link: string | null
  read_at: string | null
  created_at: string
}

export interface TenantContext {
  tenant: Tenant
  role: Role
  employee: Employee
  userId: string
}
