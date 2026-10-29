import { avatarTone } from "@/lib/avatar-tone"
import { fullName, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Person {
  first_name: string
  last_name: string
  avatar_url?: string | null
  position?: string | null
}

export function EmployeeAvatar({ person, className }: { person: Person | null | undefined; className?: string }) {
  const name = person ? `${person.first_name} ${person.last_name}` : "?"
  const tone = avatarTone(name)
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-tight", className)}
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {initials(person)}
    </span>
  )
}

export function PersonCell({ person, subtitle, className }: { person: Person | null | undefined; subtitle?: string | null; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <EmployeeAvatar person={person} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{fullName(person)}</p>
        {(subtitle ?? person?.position) && <p className="truncate text-xs text-muted-foreground">{subtitle ?? person?.position}</p>}
      </div>
    </div>
  )
}
