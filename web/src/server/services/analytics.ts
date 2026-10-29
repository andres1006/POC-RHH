import 'server-only'
import { withTenant } from '../db/client'
import { employees, requests } from '../db/schema'
import { assertCan, type Ctx } from '../context'

export function peopleAnalytics(ctx: Ctx) {
  assertCan(ctx, 'analytics.view')
  return withTenant(ctx.tenant.id, async (tx) => {
    const people = await tx.select({ department: employees.department, contractType: employees.contractType, hireDate: employees.hireDate }).from(employees)
    const reqs = await tx.select({ status: requests.status }).from(requests)
    const tally = (keys: string[]) => keys.map((name) => ({ name, value: 0 }))
    const byArea = tally([...new Set(people.map((e) => e.department))].sort())
    const contracts = tally([...new Set(people.map((e) => e.contractType))])
    people.forEach((e) => { byArea.find((a) => a.name === e.department)!.value++; contracts.find((c) => c.name === e.contractType)!.value++ })
    const now = new Date()
    const headcount = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i + 1, 0).toISOString().slice(0, 10)
      return { month: new Date(d).toLocaleDateString('es-CO', { month: 'short' }), value: people.filter((e) => e.hireDate <= d).length }
    })
    const count = (s: string) => reqs.filter((r) => r.status === s).length
    return {
      headcount: people.length, areas: byArea.length, byArea, contracts, series: headcount,
      hiresThisYear: people.filter((e) => e.hireDate.startsWith(String(now.getFullYear()))).length,
      requests: { total: reqs.length, pending: count('pending'), approved: count('approved'), rejected: count('rejected') },
    }
  })
}
