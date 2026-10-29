"use client"

import { useTransition } from "react"
import { LogIn, LogOut } from "lucide-react"
import { toast } from "sonner"
import { markAttendance } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export function ClockActions({ slug, openShift }: { slug: string; openShift: boolean }) {
  const [pending, startTransition] = useTransition()

  const mark = (kind: "in" | "out") =>
    startTransition(async () => {
      const res = await markAttendance(slug, kind)
      if (res.ok) toast.success(res.message ?? "Marca registrada.")
      else toast.error(res.error)
    })

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => mark("in")} disabled={pending || openShift}>
        <LogIn /> Registrar entrada
      </Button>
      <Button variant="outline" onClick={() => mark("out")} disabled={pending || !openShift}>
        <LogOut /> Registrar salida
      </Button>
    </div>
  )
}
