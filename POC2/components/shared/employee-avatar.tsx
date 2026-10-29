import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fullName, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Person {
  first_name: string
  last_name: string
  avatar_url?: string | null
  position?: string | null
}

export function EmployeeAvatar({ person, className }: { person: Person | null | undefined; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarImage src={person?.avatar_url ?? undefined} alt="" />
      <AvatarFallback className="text-xs">{initials(person)}</AvatarFallback>
    </Avatar>
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
