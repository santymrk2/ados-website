# Development Dockerfile for Activados
# Usando Bun para mayor velocidad

FROM oven/bun:1

WORKDIR /app

# Instalar dependencias
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo
CMD ["bun", "run", "dev"]