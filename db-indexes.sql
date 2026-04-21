-- ============================================================================
-- ÍNDICES DE BASE DE DATOS - PRODUCCIÓN
-- ============================================================================
-- Este archivo contiene las sentencias SQL para agregar índices a la base de datos
-- Ejemplo de uso: psql -U usuario -d base_de_datos -f db-indexes.sql
-- ============================================================================

-- ============================================================================
-- TABLA: activity_participants
-- ============================================================================

-- Index para filtrar por actividad (usado en todos los queries de activities)
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity_id
ON activity_participants(activity_id);

-- Index para filtrar por participante
CREATE INDEX IF NOT EXISTS idx_activity_participants_participant_id
ON activity_participants(participant_id);

-- Index para filtrar por equipo
CREATE INDEX IF NOT EXISTS idx_activity_participants_equipo
ON activity_participants(equipo);

-- ============================================================================
-- TABLA: juegos
-- ============================================================================

-- Index para filtrar por actividad
CREATE INDEX IF NOT EXISTS idx_juegos_activity_id
ON juegos(activity_id);

-- ============================================================================
-- TABLA: juego_posiciones
-- ============================================================================

-- Index para filtrar por juego
CREATE INDEX IF NOT EXISTS idx_juego_posiciones_juego_id
ON juego_posiciones(juego_id);

-- ============================================================================
-- TABLA: partidos
-- ============================================================================

-- Index para filtrar por actividad
CREATE INDEX IF NOT EXISTS idx_partidos_activity_id
ON partidos(activity_id);

-- Index para filtrar por deporte
CREATE INDEX IF NOT EXISTS idx_partidos_deporte
ON partidos(deporte);

-- ============================================================================
-- TABLA: goles
-- ============================================================================

-- Index para filtrar por actividad
CREATE INDEX IF NOT EXISTS idx_goles_activity_id
ON goles(activity_id);

-- Index para filtrar por participante
CREATE INDEX IF NOT EXISTS idx_goles_participant_id
ON goles(participant_id);

-- Index para filtrar por equipo
CREATE INDEX IF NOT EXISTS idx_goles_team
ON goles(team);

-- Index para filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_goles_tipo
ON goles(tipo);

-- ============================================================================
-- TABLA: extras
-- ============================================================================

-- Index para filtrar por actividad
CREATE INDEX IF NOT EXISTS idx_extras_activity_id
ON extras(activity_id);

-- Index para filtrar por participante
CREATE INDEX IF NOT EXISTS idx_extras_participant_id
ON extras(participant_id);

-- Index para filtrar por equipo
CREATE INDEX IF NOT EXISTS idx_extras_team
ON extras(team);

-- ============================================================================
-- TABLA: invitaciones
-- ============================================================================

-- Index para filtrar por actividad
CREATE INDEX IF NOT EXISTS idx_invitaciones_activity_id
ON invitaciones(activity_id);

-- Index para filtrar por invitador
CREATE INDEX IF NOT EXISTS idx_invitaciones_invitador_id
ON invitaciones(invitador_id);

-- Index para filtrar por invitado
CREATE INDEX IF NOT EXISTS idx_invitaciones_invitado_id
ON invitaciones(invitado_id);

-- ============================================================================
-- TABLA: push_subscriptions
-- ============================================================================

-- Index para filtrar por participante
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_participant_id
ON push_subscriptions(participant_id);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que los índices se crearon correctamente
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- ============================================================================
-- NOTAS DE RENDIMIENTO
-- ============================================================================
--
-- Estos índices mejoran significativamente el rendimiento de las siguientes queries:
--
-- 1. GET /api/activities:
--    - activityParticipants.activityId → filtrar asistentes
--    - juegos.activityId → filtrar juegos
--    - juegoPosiciones.juegoId → posiciones
--    - partidos.activityId → partidos
--    - goles.activityId → goles
--    - extras.activityId → extras
--    - invitaciones.activityId → invitaciones
--
-- 2. Rankings:
--    - activityParticipants.participantId → calcular puntos por persona
--    - invitaciones.invitadorId → contar invitados
--    - goles.participantId → filtrar goles por jugador
--
-- 3. Filtros comunes:
--    - activities.locked → filtrar actividades activas
--    - participants.sexo → filtrar por género
--
-- ============================================================================