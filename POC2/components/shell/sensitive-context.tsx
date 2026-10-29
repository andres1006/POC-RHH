"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { setSensitiveHidden } from "@/lib/actions"

const SensitiveContext = createContext<{ hidden: boolean; toggle: () => void }>({ hidden: false, toggle: () => {} })

export function SensitiveProvider({ initial, children }: { initial: boolean; children: ReactNode }) {
  const [hidden, setHidden] = useState(initial)
  const toggle = useCallback(() => {
    setHidden((h) => {
      void setSensitiveHidden(!h)
      return !h
    })
  }, [])
  return <SensitiveContext.Provider value={{ hidden, toggle }}>{children}</SensitiveContext.Provider>
}

export function useSensitive() {
  return useContext(SensitiveContext)
}

/** Wraps salary, ID numbers and social-security data so the eye toggle can hide them app-wide. */
export function Sensitive({ children, className }: { children: ReactNode; className?: string }) {
  const { hidden } = useSensitive()
  return (
    <span className={`${hidden ? "sensitive-hidden" : ""} ${className ?? ""}`} aria-hidden={hidden || undefined} title={hidden ? "Dato oculto" : undefined}>
      {hidden ? "••••••" : children}
    </span>
  )
}
