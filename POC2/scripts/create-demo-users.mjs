import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

for (const line of readFileSync(".env.development.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_PASSWORD = "NexoDemo2026!"
const users = [
  ["andina", "employee", "Camila Rodríguez"],
  ["andina", "leader", "Andrés Gómez"],
  ["andina", "hr", "Laura Martínez"],
  ["andina", "admin", "Felipe Castro"],
  ["cafe", "employee", "Santiago Herrera"],
  ["cafe", "leader", "Valentina López"],
  ["cafe", "hr", "Mariana Torres"],
  ["cafe", "admin", "Julián Ramírez"],
]

const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 })
for (const [slug, role, fullName] of users) {
  const email = `${role}.${slug}@nexorh.app`
  if (existing?.users.some((u) => u.email === email)) {
    console.log("exists", email)
    continue
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, demo_role: role, demo_tenant: slug },
  })
  if (error) console.error("error", email, error.message)
  else console.log("created", email, data.user.id)
}
