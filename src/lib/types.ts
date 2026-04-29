// ============================================================================
// TIPOS CENTRALIZADOS DEL PROYECTO
// Basados en el schema de Drizzle y la transformación de las APIs
// ============================================================================

// ----------------------------------------------------------------------------
// PARTICIPANT - Usuario/socio del sistema
// ----------------------------------------------------------------------------
export interface Participant {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  sexo: string;
  foto: string | null;
  fotoAltaCalidad: string | null;
  invitadoPor: number | null;
  // Campos adicionales que pueden existir en ciertos contextos
  apodo?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface ParticipantBasic {
  // Versiónlight usada en listados (sin fotos de alta calidad)
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  sexo: string;
  foto: string | null;
  fotoAltaCalidad?: string | null;
  invitadoPor: number | null;
  // Campos adicionales que pueden existir en ciertos contextos
  apodo?: string | null;
  telefono?: string | null;
  email?: string | null;
  acts?: number;
}

// ----------------------------------------------------------------------------
// ACTIVITY - Una jornada/actividad específica
// ----------------------------------------------------------------------------

// Juego dentro de una actividad
export interface Juego {
  id: number | string;
  nombre: string | null;
  pos: Record<string, string[]>;
}

// Partido dentro de una actividad
export interface Partido {
  id: number;
  deporte: string;
  genero: string;
  eq1: string;
  eq2: string;
  resultado: string | null;
}

// Gol scored por un participante
export interface Gol {
  id?: number;
  pid: number | null; // participantId
  tipo: 'f' | 'h' | 'b'; // faltante, hora, biblia
  cant: number;
  matchId?: number | null;
  team?: string | null;
  sexo?: string; //sexo del jugador para filtrar goleadores
}

// Extra/descuento de puntos (penalización o bonus)
export interface Extra {
  id?: number;
  pid: number | null; // participantId
  team?: string | null;
  tipo: 'extra' | 'descuento';
  puntos: number;
  motivo?: string | null;
  desc?: string | null; // Alias para compatibilidad (usado en algunos componentes)
}

// Invitación entre participantes
export interface Invitacion {
  invitador?: number | null;
  invitadorId?: number | null;
  invitadoId: number | null;
}

// Actividad completa (respuesta de /api/activities)
export interface Activity {
  id: number;
  version?: number;
  fecha: string;
  titulo: string;
  cantEquipos: number;
  locked: boolean;
  // Arrays de participant IDs
  asistentes: number[];
  puntuales: number[];
  biblias: number[];
  socials: number[];
  // Maps: participantId -> equipo
  equipos: Record<string, string>;
  juegos: Juego[];
  partidos: Partido[];
  goles: Gol[];
  extras: Extra[];
  descuentos: Extra[]; // Alias para extras con tipo='descuento'
  invitaciones: Invitacion[];
}

// Tipo para crear/actualizar activity (input)
export interface ActivityInput {
  id?: number;
  fecha: string;
  titulo: string;
  cantEquipos: number;
  locked: boolean;
}

// ----------------------------------------------------------------------------
// RANKING - Clasificación de un participante
// ----------------------------------------------------------------------------
export interface Ranking {
  id: number; // participantId
  total: number; // puntos totales
  gf: number; // goles faltantes
  gh: number; // goles hora
  gb: number; // goles biblia
  acts: number; // actividades asistidas
  invitados: number; // cantidad de personas invitadas
}

// ----------------------------------------------------------------------------
// ROLES Y AUTENTICACIÓN
// ----------------------------------------------------------------------------
export type Role = 'admin' | 'viewer';

export interface AuthState {
  isAuthenticated: boolean;
  role: Role;
}

// ----------------------------------------------------------------------------
// UI STATE
// ----------------------------------------------------------------------------
export interface UIState {
  showSettings: boolean;
  showNotifications: boolean;
}

// ----------------------------------------------------------------------------
// DB STATE
// ----------------------------------------------------------------------------
export interface DBData {
  participants: ParticipantBasic[];
  activities: Activity[];
  rankings: Ranking[];
  nextPid: number;
  nextAid: number;
}

export interface DBState {
  loading: boolean;
  error: Error | null;
  connected: boolean;
  checked: boolean;
}

// ----------------------------------------------------------------------------
// ESTADO APP (combinado)
// ----------------------------------------------------------------------------
export interface AppState {
  participants: ParticipantBasic[];
  activities: Activity[];
  rankings: Ranking[];
  dbLoading: boolean;
  dbError: Error | null;
  dbConnected: boolean;
}

// ----------------------------------------------------------------------------
// STATS CALCULADOS (para display)
// ----------------------------------------------------------------------------
export interface ParticipantStats {
  total: number;
  gf: number;
  gh: number;
  gb: number;
  acts: number;
}

export interface TeamPoints {
  team: string;
  points: number;
}

// ----------------------------------------------------------------------------
// API RESPONSES
// ----------------------------------------------------------------------------
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ----------------------------------------------------------------------------
// UTILITY TYPES
// ----------------------------------------------------------------------------

// Make all properties optional recursively (useful for partial updates)
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Type guard para verificar si es un tipo específico
export function isActivity(obj: unknown): obj is Activity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'fecha' in obj &&
    'asistentes' in obj
  );
}

export function isParticipant(obj: unknown): obj is Participant {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'nombre' in obj &&
    'apellido' in obj
  );
}

export function isRanking(obj: unknown): obj is Ranking {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'total' in obj
  );
}

// ----------------------------------------------------------------------------
// DTOs PARA COMPONENTES
// ----------------------------------------------------------------------------

// Dashboard stats
export interface DashboardStats {
  totalParticipantes: number;
  totalActividades: number;
  ultimoEncuentro: string | null;
  promedioAsistencia: number;
  rankingTop5: Ranking[];
  upcomingActivity: Activity | null;
}

// Activity con datos de participantes (para view/edit)
export interface ActivityWithDetails {
  activity: Activity;
  participantes: ParticipantBasic[];
}

// Participant con stats (para detail page)
export interface ParticipantWithStats {
  participant: Participant;
  stats: ParticipantStats;
  actividades: Activity[];
  invitador?: Participant | null;
  invitados: Participant[];
}

// Formularios
export interface ParticipantFormData {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: string;
  foto?: string | null;
  fotoAltaCalidad?: string | null;
  invitadoPor?: number | null;
}

export interface ActivityFormData {
  fecha: string;
  titulo: string;
  cantEquipos: number;
  locked: boolean;
}

// Deportes
export type Deporte = 'Fútbol' | 'Handball' | 'Básquet' | 'Vóley' | 'Otro';
export type Genero = 'M' | 'F' | 'Mixto';

export interface PartidoFormData {
  deporte: Deporte;
  genero: Genero;
  eq1: string;
  eq2: string;
}

// Tablas de actividad
export interface TabAsistenciaRow {
  participant: ParticipantBasic;
  asistencia: boolean;
  puntual: boolean;
  biblia: boolean;
  social: boolean;
  equipo: string | null;
}

export interface TabGolesRow {
  participantId: number;
  participantName: string;
  team: string | null;
  tipo: 'f' | 'h' | 'b';
  cantidad: number;
}

export interface TabExtrasRow {
  id?: number;
  participantId: number | null;
  team: string | null;
  tipo: 'extra' | 'descuento';
  puntos: number;
  motivo: string | null;
}

// Tipo para equipos en una actividad
export interface TeamAssignment {
  participantId: number;
  equipo: string;
}