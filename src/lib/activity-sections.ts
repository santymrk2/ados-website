import {
  FileText,
  Users,
  LayoutGrid,
  BookOpen,
  Gamepad2,
  Volleyball,
  Plus,
  Mail,
  type LucideIcon,
} from "lucide-react";

// ── Section IDs ──────────────────────────────────────────────────────────────

export const SECTION_IDS = {
  GENERAL: "general",
  ASISTENCIA: "asistencia",
  EQUIPOS: "equipos",
  BIBLIA: "biblia",
  JUEGOS: "juegos",
  GOLES: "goles",
  EXTRAS: "extras",
  INVITACIONES: "invitaciones",
} as const;

type SectionIdValue = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

export type SectionId = SectionIdValue;

// ── Section definition ───────────────────────────────────────────────────────

export interface SectionDefinition {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  /** Who can edit this section */
  editPermission: "admin" | "admin+biblia";
  /** Whether FloatingNav search is available in this section */
  hasSearch: boolean;
  /** Whether FloatingNav filter panel is available */
  hasFilter: boolean;
  /** Summary shown in read mode header */
  summary: string;
}

export const ACTIVITY_SECTIONS: SectionDefinition[] = [
  {
    id: SECTION_IDS.GENERAL,
    label: "General",
    icon: FileText,
    editPermission: "admin",
    hasSearch: false,
    hasFilter: false,
    summary: "Configuración de la actividad",
  },
  {
    id: SECTION_IDS.ASISTENCIA,
    label: "Asistencia",
    icon: Users,
    editPermission: "admin",
    hasSearch: true,
    hasFilter: true,
    summary: "Presentes, puntualidad y puntos",
  },
  {
    id: SECTION_IDS.EQUIPOS,
    label: "Equipos",
    icon: LayoutGrid,
    editPermission: "admin",
    hasSearch: true,
    hasFilter: false,
    summary: "Distribución de equipos",
  },
  {
    id: SECTION_IDS.BIBLIA,
    label: "Biblia",
    icon: BookOpen,
    editPermission: "admin+biblia",
    hasSearch: true,
    hasFilter: false,
    summary: "Lectura y puntos de biblia",
  },
  {
    id: SECTION_IDS.JUEGOS,
    label: "Juegos",
    icon: Gamepad2,
    editPermission: "admin",
    hasSearch: false,
    hasFilter: false,
    summary: "Juegos y posiciones",
  },
  {
    id: SECTION_IDS.GOLES,
    label: "Goles",
    icon: Volleyball,
    editPermission: "admin",
    hasSearch: false,
    hasFilter: false,
    summary: "Goles por deporte y jugador",
  },
  {
    id: SECTION_IDS.EXTRAS,
    label: "Extras",
    icon: Plus,
    editPermission: "admin",
    hasSearch: true,
    hasFilter: false,
    summary: "Bonificaciones y descuentos",
  },
  {
    id: SECTION_IDS.INVITACIONES,
    label: "Invitaciones",
    icon: Mail,
    editPermission: "admin",
    hasSearch: false,
    hasFilter: false,
    summary: "Quién invitó a quién",
  },
] as const;

export function getSectionDef(id: SectionId): SectionDefinition {
  const def = ACTIVITY_SECTIONS.find((s) => s.id === id);
  if (!def) throw new Error(`Unknown section: ${id}`);
  return def;
}

export function canEditSection(
  sectionId: SectionId,
  role: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  const def = getSectionDef(sectionId);
  if (def.editPermission === "admin+biblia") return true; // non-admin with biblia perm
  return false;
}

// ── Default section (first in nav) ───────────────────────────────────────────

export const DEFAULT_SECTION: SectionId = SECTION_IDS.ASISTENCIA;
