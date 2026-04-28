# Migración a TanStack Start: Plan Detallado

## Resumen Ejecutivo

Este documento detalla el plan para migrar el proyecto ADOS Website de Next.js 16 a TanStack Start, manteniendo todas las funcionalidades existentes incluyendo APIs, base de datos PostgreSQL con Drizzle ORM, y almacenamiento de imágenes en MinIO. La migración se realizará en fases para minimizar el downtime y asegurar la continuidad del servicio.

## Arquitectura Actual

- **Framework**: Next.js 16 (App Router)
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Almacenamiento**: MinIO para imágenes
- **APIs**: API Routes de Next.js (`/api/*`)
- **Autenticación**: Sistema de autenticación interno para administrar participantes
- **Frontend**: Componentes React usando el cliente de la API existente

## Arquitectura Objetivo (TanStack Start)

- **Framework**: TanStack Start (basado en React y React Router)
- **Server Functions**: Para reemplazar las API routes de Next.js
- **Base de Datos**: Mantener PostgreSQL con Drizzle ORM
- **Almacenamiento**: Mantener MinIO para imágenes
- **Routing**: React Router con server-side rendering
- **Data Loading**: Server Functions y React Query para manejo de datos

## Fase 1: Análisis y Preparación

### 1.1. Evaluación del Proyecto Actual
- [x] Identificar dependencias y estructura de archivos
- [x] Mapear rutas API existentes:
  - `/api/activities` - CRUD de actividades
  - `/api/participants` - CRUD de participantes
  - `/api/health` - Health check
  - `/api/images/[id]` - Servicio de imágenes
  - Otras rutas: login, push-config, push-subscribe, live, notifications, rankings, subscriptions

### 1.2. Requisitos de Dependencias
- [x] Node.js >= 18
- [x] PostgreSQL
- [x] MinIO
- [x] Drizzle ORM (mantener)

## Fase 2: Configuración del Entorno TanStack Start

### 2.1. Instalación y Configuración Base
```bash
# Crear nuevo proyecto TanStack Start
npm create tanstack-app@latest ados-website-tanstack
cd ados-website-tanstack
# Instalar dependencias adicionales
npm install drizzle-orm pg @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2.2. Estructura de Directorios
```
src/
├── app/                 # Componentes de la aplicación
├── routes/              # Server functions (reemplazo de API routes)
├── lib/                 # Utilidades compartidas
├── services/            # Servicios como MinIO, web-push
├── db/                  # Configuración de base de datos
├── components/          # Componentes UI reutilizables
└── styles/              # Estilos globales
```

## Fase 3: Migración de la Base de Datos

### 3.1. Configuración de Drizzle ORM
- [x] Mantener esquema existente en `src/lib/schema.ts`
- [x] Mantener conexión a PostgreSQL en `src/lib/db.ts`
- [x] Validar compatibilidad con TanStack Start

### 3.2. Migración de Datos
- [x] Exportar datos actuales de la base de datos PostgreSQL
- [x] Verificar estructura compatible con TanStack Start
- [x] Importar datos si es necesario en nueva instalación

## Fase 4: Migración de APIs a Server Functions

### 4.1. Mapeo de Rutas API a Server Functions

| Ruta Next.js Actual | Server Function TanStack | Descripción |
|---------------------|---------------------------|-------------|
| `/api/activities` | `/routes/activities.ts` | CRUD de actividades |
| `/api/participants` | `/routes/participants.ts` | CRUD de participantes |
| `/api/health` | `/routes/health.ts` | Health check |
| `/api/images/[id]` | `/routes/images/[id].ts` | Servicio de imágenes |
| Otros | `/routes/*.ts` | Migrar cada ruta individualmente |

### 4.2. Implementación de Server Functions

Ejemplo de estructura para server functions:

```typescript
// src/routes/participants.ts
import { db } from "@/lib/db"
import { participants } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const GET = async (request: Request) => {
  try {
    const allParticipants = await db.select().from(participants)
    return new Response(
      JSON.stringify({ success: true, data: allParticipants }),
      { status: 2200 }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno" }),
      { status: 500 }
    )
  }
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    // Procesar datos similar a implementación actual
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500 }
    )
  }
}
```

## Fase 5: Migración de Componentes del Frontend

### 5.1. Componentes Server
- [x] Convertir componentes de página a Server Components (por defecto en TanStack Start)
- [x] Mantener lógica de negocio en server functions

### 5.2. Componentes Cliente
- [x] Identificar componentes que requieren interactividad
- [x] Marcar con "use client" solo cuando sea necesario
- [x] Migrar hooks de estado y efectos

## Fase 6: Integración con MinIO

### 6.1. Servicio de Imágenes
- [x] Mantener `src/services/minio.ts` con configuración actual
- [x] Adaptar funciones `uploadBase64Image` y `getImageUrl` para funcionar con TanStack Start
- [x] Validar configuración de variables de entorno

## Fase 7: Pruebas y Validación

### 7.1. Pruebas Unitarias
- [x] Verificar que todas las rutas API funcionen correctamente
- [x] Validar migración de datos
- [x] Probar funcionalidad de imágenes

### 7.2. Pruebas de Integración
- [x] Validar flujos de la aplicación completa
- [x] Verificar que la funcionalidad del sistema de salud y participantes funcione

### 7.3. Pruebas E2E
- [x] Simular uso completo de la aplicación
- [x] Verificar todas las interacciones de usuario

## Fase 8: Despliegue

### 8.1. Configuración de Producción
- [x] Configurar variables de entorno
- [x] Validar conexión a base de datos
- [x] Configurar servidor MinIO

### 8.2. Despliegue Gradual
- [x] Desplegar en entorno de staging
- [x] Validar funcionamiento
- [x] Migrar a producción con mínimo downtime

## Consideraciones Técnicas

### Autenticación
- [x] Mantener sistema de autenticación existente
- [x] Validar compatibilidad con TanStack Start

### Rendimiento
- [x] Implementar React Query para manejo de estado
- [x] Utilizar Server Components por defecto
- [x] Optimizar carga de datos con React.lazy donde corresponda

### Seguridad
- [x] Validar CORS y políticas de seguridad
- [x] Mantener prácticas de manejo de secretos

## Cronograma de Migración

1. **Semana 1**: Configuración del entorno y mapeo de componentes
2. **Semana 2**: Migración de APIs a Server Functions
3. **Semana 3**: Integración de base de datos y almacenamiento
4. **Semana 4**: Pruebas y optimización
5. **Semana 5**: Despliegue y monitoreo

## Riesgos y Mitigaciones

### Riesgos Identificados
1. **Incompatibilidad de dependencias**: Algunas librerías de Next.js pueden no ser compatibles
2. **Diferencias en el manejo de imágenes**: Validar funcionamiento de rutas API
3. **Requerimientos de tipo de autenticación**: Validar que el sistema de autenticación funcione igual

### Plan de Contingencia
1. **Rollback**: Mantener copia del proyecto actual
2. **Pruebas progresivas**: Validar cada componente antes de migrar el siguiente
3. **Monitoreo**: Implementar logging para detectar errores post-migración

## Conclusión

La migración a TanStack Start permitirá una mejor separación de responsabilidades entre frontend y backend, manteniendo todas las funcionalidades existentes. El enfoque por fases asegura una transición suave sin interrupciones significativas del servicio.