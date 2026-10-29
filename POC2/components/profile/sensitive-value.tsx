"use client"

import type { ReactNode } from "react"
import { Sensitive } from "@/components/shell/sensitive-context"
import { formatCOP } from "@/lib/format"

export function SensitiveValue({ children, currency }: { children?: ReactNode; currency?: number }) {
  return <Sensitive>{currency != null ? formatCOP(currency) : children}</Sensitive>
}
