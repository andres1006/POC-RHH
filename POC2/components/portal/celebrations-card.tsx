import { Cake, PartyPopper } from "lucide-react"
import { addDays, format, getDate, getMonth, isWithinInterval, setYear, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import type { Employee } from "@/lib/types"
import { toDate } from "@/lib/format"
import { EmployeeAvatar } from "@/components/shared/employee-avatar"
import { Card } from "@/components/ui/card"

function thisWeek(dateStr: string | null): Date | null {
  const d = toDate(dateStr)
  if (!d) return null
  const today = startOfToday()
  const candidate = setYear(d, today.getFullYear())
  return isWithinInterval(candidate, { start: today, end: addDays(today, 6) }) ? candidate : null
}

export function CelebrationsCard({ employees }: { employees: Employee[] }) {
  const birthdays = employees.map((e) => ({ e, when: thisWeek(e.birth_date) })).filter((x) => x.when) as { e: Employee; when: Date }[]
  const anniversaries = employees
    .map((e) => ({ e, when: thisWeek(e.hire_date) }))
    .filter((x) => x.when && toDate(x.e.hire_date)!.getFullYear() < new Date().getFullYear()) as { e: Employee; when: Date }[]
  if (birthdays.length === 0 && anniversaries.length === 0) return null

  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="flex items-center gap-2 text-sm font-medium">
        <PartyPopper className="size-4 text-primary" aria-hidden /> Celebraciones de la semana
      </p>
      <ul className="flex flex-wrap gap-3">
        {birthdays.map(({ e, when }) => (
          <li key={`b-${e.id}`} className="flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs">
            <EmployeeAvatar person={e} className="size-7" />
            <span>
              <span className="font-medium">{e.first_name}</span> cumple años el {format(when, "d 'de' MMM", { locale: es })}
            </span>
            <Cake className="size-3.5 text-primary" aria-hidden />
          </li>
        ))}
        {anniversaries.slice(0, 4).map(({ e, when }) => {
          const years = new Date().getFullYear() - toDate(e.hire_date)!.getFullYear()
          return (
            <li key={`a-${e.id}`} className="flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs">
              <EmployeeAvatar person={e} className="size-7" />
              <span>
                <span className="font-medium">{e.first_name}</span> cumple {years} {years === 1 ? "año" : "años"} el {getDate(when)}/{getMonth(when) + 1}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
