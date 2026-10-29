import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/nexorh' },
})
