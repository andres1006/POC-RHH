// Motor de solicitudes: todo trámite (vacaciones, permisos, certificados, cambio de datos) es una HrRequest con pasos.

export type RequestType = 'vacation' | 'permission' | 'certificate' | 'data_change'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type StepStatus = 'pending' | 'approved' | 'rejected'

export type Step = { approverId: string; status: StepStatus; decidedAt?: string; comment?: string }

export type HrRequest = {
  id: string
  tenantId: string
  type: RequestType
  title: string
  requesterId: string
  payload: { from?: string; to?: string; days?: number; kind?: string; hours?: number; note?: string; changes?: Record<string, string> }
  status: RequestStatus
  steps: Step[]
  createdAt: string
  closedAt?: string | null
}

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  vacation: 'Vacaciones',
  permission: 'Permiso',
  certificate: 'Certificado',
  data_change: 'Cambio de datos',
}

export const PERMISSION_KINDS = ['Permiso remunerado', 'Permiso no remunerado', 'Cita médica', 'Día de la familia', 'Permiso por votación'] as const

export const currentStep = (r: HrRequest) => r.steps.find((s) => s.status === 'pending')

export const isAwaiting = (r: HrRequest, approverId: string) =>
  r.status === 'pending' && currentStep(r)?.approverId === approverId

/** Aplica la decisión del aprobador del paso actual. Lanza si no le corresponde decidir. */
export function decide(
  r: HrRequest,
  approverId: string,
  decision: 'approve' | 'reject',
  now: string,
  comment?: string,
): HrRequest {
  if (!isAwaiting(r, approverId)) throw new Error('No tienes esta solicitud pendiente de aprobación')
  const idx = r.steps.findIndex((s) => s.status === 'pending')
  const stepStatus: StepStatus = decision === 'approve' ? 'approved' : 'rejected'
  const steps = r.steps.map((s, i) => (i === idx ? { ...s, status: stepStatus, decidedAt: now, comment } : s))
  const last = idx === steps.length - 1
  const status: RequestStatus = decision === 'reject' ? 'rejected' : last ? 'approved' : 'pending'
  return { ...r, steps, status, closedAt: status === 'pending' ? null : now }
}
