import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from './schema'

// Una sola conexión por proceso (sobrevive al HMR en desarrollo).
const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> }
const client = (g.__pg ??= postgres(process.env.DATABASE_URL!, { max: 10 }))

export const db = drizzle(client, { schema })
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Ejecuta `fn` dentro de una transacción con el tenant fijado para RLS.
 * Toda lectura/escritura de datos de negocio debe pasar por aquí: si se olvida, RLS devuelve 0 filas.
 */
export function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`)
    return fn(tx)
  })
}
