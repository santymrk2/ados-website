# PLAN: Lavado de Cara UI/UX - ADOS Website

**Branch:** `feature/ui-overhaul-mobile-first`
**Fecha de inicio:** 2026-07-23
**Estado general:** 🔵 En progreso

---

## Resumen de Decisiones

| Decisión | Elección |
|---|---|
| Navegación principal | Drawer lateral push con `vaul` |
| Header | Unificado (AppHeader) en todas las páginas |
| Animaciones | Framer Motion (ya instalado) |
| Dark mode | Solo light mode por ahora |
| Empty states | Texto + botón (sin ilustraciones) |
| Dashboard | Stats reducidos (3), secciones colapsadas |
| Actividades | Lista compacta cronológica con búsqueda |
| Jugadores | Ultra-simple: solo búsqueda |
| Calendario | Solo cumpleaños, usar AppHeader |
| FloatingNav (actividad) | Mantener, mejorar UX |
| Dead code | Eliminar view/, edit/, NotificationsModal, BottomNav |

---

## RONDA 1: Dead Code + Drawer + Header

### 🔵 Agente 1: Dead Code + Drawer (vaul) + Header

**Estado:** ✅ Completado
**Archivos creados:** 2
**Archivos eliminados:** 23
**Archivos modificados:** 6

---

#### 1.1 Eliminar Dead Code - Rutas view/ y edit/

**Estado:** ✅ Completado

**Eliminar directorio completo:** `src/app/activities/[id]/view/`
- `src/app/activities/[id]/view/layout.tsx` (230 líneas) - Layout legacy con ViewContext no utilizado
- `src/app/activities/[id]/view/asistencia/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/view/equipos/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/view/juegos/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/view/ranking/page.tsx` (15 líneas) - Redirect stub (redirige a asistencia, bug)

**Eliminar directorio completo:** `src/app/activities/[id]/edit/`
- `src/app/activities/[id]/edit/layout.tsx` (433 líneas) - Layout legacy con EditContext no utilizado
- `src/app/activities/[id]/edit/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/asistencia/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/biblia/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/equipos/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/extras/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/goles/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/invitados/page.tsx` (15 líneas) - Redirect stub
- `src/app/activities/[id]/edit/juegos/page.tsx` (15 líneas) - Redirect stub

**Total eliminado:** ~890 líneas de código muerto

---

#### 1.2 Eliminar BottomNav

**Estado:** ✅ Completado

**Eliminar:** `src/components/ui/BottomNav.tsx` (66 líneas)

---

#### 1.3 Eliminar NotificationsModal (Dead Code)

**Estado:** ✅ Completado

**Eliminar:** `src/components/ui/NotificationsModal.tsx` (147 líneas)

**Archivos a modificar para limpiar referencias:**
- `src/store/appStore.ts`: Eliminar `$showNotifications`
- `src/hooks/useApp.ts`: Eliminar `showNotifications`, `setShowNotifications`
- `src/lib/types.ts`: Eliminar referencia a NotificationsModal

---

#### 1.4 Eliminar PageHeader y Modal legacy de Common.tsx

**Estado:** ✅ Completado

**Modificar:** `src/components/ui/Common.tsx`

Eliminar función `PageHeader` y componente `Modal` legacy.

---

#### 1.5 Limpiar dependencias de package.json

**Estado:** ✅ Completado

Eliminar `embla-carousel-react` de dependencies.

---

#### 1.6 Crear AppDrawer.tsx

**Estado:** ✅ Completado

**Crear:** `src/components/ui/AppDrawer.tsx`

Drawer izquierdo con `vaul`, push effect, avatar, stats, navegación, acciones rápidas.

---

#### 1.7 Crear AppHeader.tsx

**Estado:** ✅ Completado

**Crear:** `src/components/ui/AppHeader.tsx`

Header unificado con botón ☰ (abre drawer), "ACTIVADOS", título, botón ⚙️.

---

#### 1.8 Modificar AuthGate.tsx

**Estado:** ✅ Completado

Reemplazar BottomNav por AppDrawer, agregar push effect.

---

#### 1.9 Crear estilos CSS para drawer push

**Estado:** ✅ Completado (inline en AuthGate)

Agregar estilos en `src/app/globals.css`.

---

## RONDA 2: Simplificación de Páginas (Paralelo)

### 🟢 Agente 2: Dashboard + Activities + Players + Calendar

**Estado:** ✅ Completado
**Dependencias:** Agente 1

---

#### 2.1 Dashboard Simplificado

**Estado:** ✅ Completado

**Modificar:** `src/app/page.tsx`

- Stats: 3 cards (Actividades, Jugadores, Total Goles)
- Goleadores: Top 3 + "Ver ranking completo"
- Ranking: Top 5 + "Ver ranking completo"
- Invitaciones: Top 3
- Últimas Actividades: 2 + "Ver todas"
- Skeleton loading

---

#### 2.2 Lista de Actividades Compacta

**Estado:** ✅ Completado

**Modificar:** `src/app/activities/page.tsx`

- Lista cronológica agrupada por mes
- Filas: título + fecha/stats + lock icon + flecha
- Búsqueda
- Skeleton loading

---

#### 2.3 Jugadores Ultra-Simple

**Estado:** ✅ Completado

**Modificar:** `src/app/participants/page.tsx`

- Solo búsqueda
- Lista: avatar + nombre
- Admin actions: long press
- Skeleton loading

---

#### 2.4 Calendario - Usar AppHeader

**Estado:** ✅ Completado

**Modificar:** `src/app/calendar/page.tsx`

- Reemplazar header custom por AppHeader
- Skeleton loading

---

### 🟡 Agente 3: FloatingNav + Perfil Jugador

**Estado:** ✅ Completado
**Dependencias:** Ninguna

---

#### 3.1 FloatingNav Mejorado

**Estado:** ✅ Completado

**Modificar:** `src/components/ui/FloatingNav.tsx`

- Touch targets 44x44px
- Indicador long-press
- Feedback háptico mejorado

---

#### 3.2 Perfil de Jugador Simplificado

**Estado:** ✅ Completado

**Modificar:** `src/app/participants/[id]/page.tsx`

- Eliminar pb-20
- Skeleton loading
- Atributos data-driven
- Fix cursor pointer

---

### 🟠 Agente 4: Login + Settings

**Estado:** ✅ Completado
**Dependencias:** Ninguna

---

#### 4.1 Login Mejorado

**Estado:** ✅ Completado

**Modificar:** `src/components/auth/LoginScreen.tsx`

- Admin toggle discoverable
- Auto-focus
- Loading state

---

#### 4.2 Settings Fix iOS

**Estado:** ✅ Completado

**Modificar:** `src/components/auth/SettingsPanel.tsx`

- Paleta de colores predefinida
- Sección "Acerca de"

---

### 🔴 Agente 5: Sistema de Modals Unificado

**Estado:** ✅ Completado
**Dependencias:** Ninguna

---

#### 5.1 Crear ModalShell.tsx

**Estado:** ✅ Completado

**Crear:** `src/components/ui/ModalShell.tsx`

Shell compartido: sizing responsive, close consistente, keyboard avoidance.

---

#### 5.2 Migrar Modals a ModalShell

**Estado:** ✅ Completado

Migrar: PlayerHistoryModal, PlayerPointsModal, NewActivityModal, ImageExpandModal, ImageCropModal, PWAInstall.

---

#### 5.3 Eliminar Modal legacy

**Estado:** ✅ Completado (ya eliminado en Agente 1)

Eliminar `Modal` de `Common.tsx`.

---

## RONDA 3: Pulido Final

### 🟣 Agente 6: Pulido Final

**Estado:** ⬜ Pendiente
**Dependencias:** Todos los agentes anteriores

---

#### 6.1 Empty States Consistentes

**Estado:** ⬜ Pendiente

Patrón: icono + texto + botón en todas las páginas.

---

#### 6.2 Loading States (Skeletons)

**Estado:** ⬜ Pendiente

Skeletons en: Dashboard, Activities, Players, Calendar, Player Detail.

---

#### 6.3 Transiciones Suaves

**Estado:** ⬜ Pendiente

Framer Motion `AnimatePresence` en cambios de ruta.

---

#### 6.4 Pull-to-Refresh

**Estado:** ⬜ Pendiente

En listas de actividades y jugadores.

---

#### 6.5 Verificar Safe Areas

**Estado:** ⬜ Pendiente

Checklist de `pt-safe`/`pb-safe` en todos los componentes.

---

#### 6.6 CSS Cleanup

**Estado:** ⬜ Pendiente

Eliminar clases `.dark` no utilizadas, verificar variables CSS.

---

## Verificación Final

### Checklist de Pruebas

- [ ] Drawer abre y cierra correctamente
- [ ] Push effect funciona
- [ ] Navegación desde drawer funciona
- [ ] "Nueva Actividad" desde drawer abre modal
- [ ] "Nuevo Jugador" desde drawer navega
- [ ] Settings abre desde header y drawer
- [ ] Logout funciona desde drawer
- [ ] Dashboard muestra 3 stats cards
- [ ] Secciones colapsables funcionan
- [ ] Lista actividades agrupa por mes
- [ ] Búsqueda en actividades funciona
- [ ] Lista jugadores ultra-simple funciona
- [ ] Búsqueda en jugadores funciona
- [ ] Calendario funciona correctamente
- [ ] FloatingNav mejorado funciona
- [ ] Perfil jugador muestra datos
- [ ] Login admin toggle funciona
- [ ] Settings color picker funciona en iOS
- [ ] Modals usan ModalShell
- [ ] Empty states consistentes
- [ ] Loading states con skeletons
- [ ] Transiciones suaves
- [ ] Safe areas respetadas
- [ ] Tests actualizados
