import { describe, expect, it } from 'vitest'
import { buildDemoData, DEMO_TENANTS } from '@/server/db/demo-data'
import { accruedDays, businessDays, leaveBalance } from './leave/domain'
import { decide, type HrRequest } from './requests/domain'
import { SERVICES, matchesService, resolveServiceTitle } from './requests/catalog'
import { can } from '@/platform/rbac'

describe('businessDays', () => {
  it('excluye fines de semana', () => expect(businessDays('2026-11-02', '2026-11-08')).toBe(4)) // lun festivo
  it('excluye festivos (16 nov 2026)', () => expect(businessDays('2026-11-16', '2026-11-20')).toBe(4))
  it('rango inválido = 0', () => expect(businessDays('2026-11-10', '2026-11-01')).toBe(0))
  it('un solo día hábil', () => expect(businessDays('2026-11-04', '2026-11-04')).toBe(1))
})

describe('saldo de vacaciones', () => {
  it('15 días por año', () => expect(accruedDays('2025-01-01', '2026-01-01')).toBe(15))
  it('fecha futura no acumula', () => expect(accruedDays('2027-01-01', '2026-01-01')).toBe(0))
  it('descuenta tomadas y programadas', () =>
    expect(leaveBalance('2025-01-01', '2026-01-01', 5, 3).available).toBe(7))
})

const base: HrRequest = {
  id: 'r1', tenantId: 't', type: 'vacation', title: 'x', requesterId: 'e1', payload: {},
  status: 'pending', createdAt: '2026-10-01',
  steps: [{ approverId: 'lead', status: 'pending' }, { approverId: 'hr', status: 'pending' }],
}

describe('decide', () => {
  it('aprobar paso intermedio deja la solicitud pendiente', () => {
    const r = decide(base, 'lead', 'approve', '2026-10-02')
    expect(r.status).toBe('pending')
    expect(r.steps[0].status).toBe('approved')
  })
  it('aprobar último paso cierra como aprobada', () => {
    const r = decide(decide(base, 'lead', 'approve', 'd'), 'hr', 'approve', 'd2')
    expect(r.status).toBe('approved')
    expect(r.closedAt).toBe('d2')
  })
  it('rechazar cierra como rechazada', () => expect(decide(base, 'lead', 'reject', 'd').status).toBe('rejected'))
  it('no deja decidir a quien no le toca', () => expect(() => decide(base, 'hr', 'approve', 'd')).toThrow())
})

describe('seed de Eficacia', () => {
  const data = buildDemoData()
  const andres = data.employees.find((e) => e.email === 'andres.agudelo@eficacia.com')
  it('crea a Andres Agudelo como admin de Tecnología', () => {
    expect(andres).toMatchObject({ firstName: 'Andres', lastName: 'Agudelo', role: 'admin', department: 'Tecnología', position: 'Líder de Tecnología' })
  })
  it('siembra el catálogo de servicios y el azul de marca', () => {
    const titles = data.requests.filter((r) => r.tenantId === 't-eficacia').map((r) => r.title)
    expect(titles).toEqual(expect.arrayContaining([
      'Actualización de jefe inmediato',
      'Anticipo de prima',
      'Asignación de silla para trabajo en casa',
      'Beneficio de celular',
      'Cambio de EPS, pensión y cuenta bancaria',
      'Cambio de plan de línea celular',
      'Retiro de cesantías',
    ]))
    expect(DEMO_TENANTS.find((t) => t.slug === 'eficacia')?.primaryColor).toBe('#1E5DA1')
  })
  it('resuelve los títulos del catálogo de servicios', () => {
    expect(SERVICES.map((s) => s.id)).toEqual(['jefe', 'prima-cesantias', 'silla', 'beneficio-celular', 'eps-pension', 'plan-celular'])
    expect(resolveServiceTitle('jefe')).toBe('Actualización de jefe inmediato')
    expect(resolveServiceTitle('prima-cesantias')).toBeUndefined()
    expect(resolveServiceTitle('prima-cesantias', 'anticipo-prima')).toBe('Anticipo de prima')
    expect(resolveServiceTitle('prima-cesantias', 'retiro-cesantias')).toBe('Retiro de cesantías')
    const prima = SERVICES.find((s) => s.id === 'prima-cesantias')!
    expect(matchesService({ title: 'Anticipo de prima' }, prima)).toBe(true)
    expect(matchesService({ title: 'Actualización de jefe inmediato', payload: { kind: 'jefe' } }, prima)).toBe(false)
    expect(matchesService({ title: 'x', payload: { kind: 'prima-cesantias' } }, prima)).toBe(true)
  })
  it('conserva las cuentas demo de Andina', () => {
    const emails = data.employees.filter((e) => e.tenantId === 't-andina').map((e) => e.email)
    expect(emails).toEqual(expect.arrayContaining(['tomas.castro@andina.co', 'carolina.henao@andina.co', 'sebastian.hernandez@andina.co']))
  })
})

describe('rbac', () => {
  it('empleado no aprueba', () => expect(can('employee', 'requests.approve')).toBe(false))
  it('líder aprueba', () => expect(can('leader', 'requests.approve')).toBe(true))
  it('solo admin configura', () => expect(can('hr', 'tenant.configure')).toBe(false))
})
