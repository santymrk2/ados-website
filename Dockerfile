# ==========================================
# Etapa 1: Base
# Usamos la imagen oficial de Bun (basada en Alpine por ser muy liviana)
# ==========================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ==========================================
# Etapa 2: Dependencias (deps)
# Instalamos dependencias primero para aprovechar el caché de Docker
# ==========================================
FROM base AS deps
COPY package.json bun.lock ./
# Instalamos usando Bun. --frozen-lockfile asegura que se instale exactamente lo del lock
RUN bun install --frozen-lockfile

# ==========================================
# Etapa 3: Construcción (builder)
# Copiamos el código fuente y compilamos la app de Next.js
# ==========================================
FROM base AS builder
# Copiamos las dependencias instaladas en la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivamos la telemetría de Vercel durante el build para ahorrar tiempo
ENV NEXT_TELEMETRY_DISABLED=1

# Compilamos el proyecto (Bun ejecutará el script "build" de tu package.json)
RUN bun run build

# ==========================================
# Etapa 4: Producción (runner)
# Creamos la imagen final, super liviana y segura
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Por seguridad, no ejecutamos la app como el usuario "root"
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copiamos la carpeta public si tienes imágenes, fuentes, etc.
COPY --from=builder /app/public ./public

# Copiamos los archivos estáticos y el servidor standalone que generó Next.js
# Le damos los permisos al usuario no-root que creamos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Exponemos el puerto
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ejecutamos el servidor standalone usando Bun
CMD ["bun", "run", "server.js"]