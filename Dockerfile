# Production Dockerfile for Activados
# Optimizado para Dokploy usando Bun

FROM oven/bun:1 AS base
WORKDIR /app

# ---- Dependencias ----
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar el build de Next.js
RUN bun run build

# ---- Producción ----
FROM base AS runner
WORKDIR /app

# Variables de entorno para producción
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copiar archivos necesarios
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env* ./.env* 2>/dev/null || true

# Exponer puerto
EXPOSE 3000

# Iniciar aplicación en producción
CMD ["bun", "run", "start"]