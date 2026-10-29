# App Next.js en modo standalone. Al arrancar aplica migraciones y siembra el demo si la base está vacía.
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json package.json ./
COPY scripts ./scripts
COPY src ./src
CMD ["sh", "-c", "npx drizzle-kit migrate && ([ \"$SEED_DEMO\" = true ] && npx tsx scripts/seed.ts || true) && node server.js"]
