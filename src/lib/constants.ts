export const TEAMS = ["E1", "E2", "E3", "E4", "E5", "E6"];

const DEFAULT_TEAM_COLORS: Record<string, string> = {
  E1: "#FF6B6B",
  E2: "#4ECDC4", 
  E3: "#FFD93D",
  E4: "#A78BFA",
  E5: "#FB923C",
  E6: "#2DD4BF"
};

const DEFAULT_TEAM_BG_LIGHT: Record<string, string> = {
  E1: "#FFECEC",
  E2: "#E8F5F3", 
  E3: "#FFF8E1",
  E4: "#F3EEFC",
  E5: "#FFF1E6",
  E6: "#E2FBF9"
};

const DEFAULT_TEAM_BG: Record<string, string> = {
  E1: "#2A1010",
  E2: "#0A2220",
  E3: "#2A2200",
  E4: "#1A1230",
  E5: "#2E1B0A",
  E6: "#0A2A26"
};

function getStoredTeamColors() {
  if (typeof window === 'undefined') return DEFAULT_TEAM_COLORS;
  const stored = localStorage.getItem('teamColors');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TEAM_COLORS;
    }
  }
  return DEFAULT_TEAM_COLORS;
}

function getStoredTeamBgLight() {
  if (typeof window === 'undefined') return DEFAULT_TEAM_BG_LIGHT;
  const stored = localStorage.getItem('teamBgLight');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TEAM_BG_LIGHT;
    }
  }
  return DEFAULT_TEAM_BG_LIGHT;
}

function getStoredTeamBg() {
  if (typeof window === 'undefined') return DEFAULT_TEAM_BG;
  const stored = localStorage.getItem('teamBg');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TEAM_BG;
    }
  }
  return DEFAULT_TEAM_BG;
}

export function getTeamColors() {
  return getStoredTeamColors();
}

export function getTeamBgLight() {
  return getStoredTeamBgLight();
}

export function getTeamBgDark() {
  return getStoredTeamBg();
}

export function getTeamColor(team: string): string {
  return getStoredTeamColors()[team] || DEFAULT_TEAM_COLORS[team] || '#cccccc';
}

export function getTeamBg(team: string): string {
  return getStoredTeamBgLight()[team] || DEFAULT_TEAM_BG_LIGHT[team] || '#f5f5f5';
}

export function getTeamBgDarkColor(team: string): string {
  return getStoredTeamBg()[team] || DEFAULT_TEAM_BG[team] || '#1a1a1a';
}

export function getTeamBgLightColor(team: string): string {
  return getStoredTeamBgLight()[team] || DEFAULT_TEAM_BG_LIGHT[team] || '#f5f5f5';
}

// Constantes con valores por defecto - se actualizan en runtime via syncTeamConstants()
export const TEAM_COLORS: Record<string, string> = { ...DEFAULT_TEAM_COLORS };
export const TEAM_BG_LIGHT: Record<string, string> = { ...DEFAULT_TEAM_BG_LIGHT };
export const TEAM_BG: Record<string, string> = { ...DEFAULT_TEAM_BG };

export function syncTeamConstants() {
  const colors = getStoredTeamColors();
  const bgLight = getStoredTeamBgLight();
  const bgDark = getStoredTeamBg();

  TEAMS.forEach(team => {
    TEAM_COLORS[team] = colors[team] || DEFAULT_TEAM_COLORS[team];
    TEAM_BG_LIGHT[team] = bgLight[team] || DEFAULT_TEAM_BG_LIGHT[team];
    TEAM_BG[team] = bgDark[team] || DEFAULT_TEAM_BG[team];
  });
}

export function saveTeamColors(colors: Record<string, string>) {
  if (typeof window === 'undefined') return;
  
  const lightColors: Record<string, string> = {};
  const darkColors: Record<string, string> = {};
  
  Object.entries(colors).forEach(([team, color]) => {
    lightColors[team] = lightenColor(color, 85);
    darkColors[team] = darkenColor(color, 60);
  });
  
  localStorage.setItem('teamColors', JSON.stringify(colors));
  localStorage.setItem('teamBgLight', JSON.stringify(lightColors));
  localStorage.setItem('teamBg', JSON.stringify(darkColors));
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
export const MEDALS = ["1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°"];
export const DEPORTES = ["Fútbol", "Handball", "Básquet", "Vóley", "Otro"];
export const GENEROS = [
  { val: "M", label: "Varones" },
  { val: "F", label: "Mujeres" }
];
export const PTS = {
  asistencia: 10,
  puntualidad: 5,
  biblia: 2,
  invite: 5,
  rec: { 1: 10, 2: 7, 3: 4, 4: 2, 5: 1, 6: 0 },
};

function calcularEdad(fechaNacimiento: string | null | undefined): number {
  if (!fechaNacimiento) return 0;
  const [year, month, day] = fechaNacimiento.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let edad = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    edad--;
  }
  return edad;
}

export function getEdad(fechaNacimiento: string | null | undefined): number {
  return calcularEdad(fechaNacimiento);
}

function generarFechaNacimiento(edad: string) {
  if (!edad) return "";
  const hoy = new Date();
  const año = hoy.getFullYear() - parseInt(edad);
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const día = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}

function generarEdadAPartirDeFecha(fecha: string) {
  if (!fecha) return "";
  const edad = calcularEdad(fecha);
  return edad !== null ? String(edad) : "";
}

export const SEED_PARTICIPANTS = [
  { id: 1, nombre: "Ana Luz", apellido: "Aquino", fechaNacimiento: "2007-01-15", sexo: "F", foto: "" },
  { id: 2, nombre: "Gian Franco", apellido: "Carbone", fechaNacimiento: "2010-05-20", sexo: "M", foto: "" },
  { id: 3, nombre: "Tomás", apellido: "Barrera", fechaNacimiento: "2011-08-10", sexo: "M", foto: "" },
  { id: 4, nombre: "Rodrigo", apellido: "Rolón", fechaNacimiento: "2013-02-28", sexo: "M", foto: "" },
  { id: 5, nombre: "Jonás", apellido: "Corvalán", fechaNacimiento: "2013-04-15", sexo: "M", foto: "" },
  { id: 6, nombre: "Felipe", apellido: "Morinico", fechaNacimiento: "2012-11-22", sexo: "M", foto: "" },
  { id: 7, nombre: "Alma", apellido: "Ochnicki", fechaNacimiento: "2013-07-08", sexo: "F", foto: "" },
  { id: 8, nombre: "Candela", apellido: "Ayala", fechaNacimiento: "2012-09-30", sexo: "F", foto: "" },
  { id: 9, nombre: "Catalina", apellido: "Sánchez", fechaNacimiento: "2014-12-05", sexo: "F", foto: "" },
  { id: 10, nombre: "Catalina", apellido: "Flores", fechaNacimiento: "2012-03-18", sexo: "F", foto: "" },
  { id: 11, nombre: "Victoria", apellido: "Gumpp", fechaNacimiento: "2013-06-12", sexo: "F", foto: "" },
  { id: 12, nombre: "Ludmila", apellido: "Sánchez", fechaNacimiento: "2013-10-25", sexo: "F", foto: "" },
  { id: 13, nombre: "Sara", apellido: "Vargas", fechaNacimiento: "2014-01-08", sexo: "F", foto: "" },
  { id: 14, nombre: "Agostina", apellido: "López", fechaNacimiento: "2011-04-20", sexo: "F", foto: "" },
  { id: 15, nombre: "Priscila", apellido: "Espíndola", fechaNacimiento: "2013-08-14", sexo: "F", foto: "" },
  { id: 16, nombre: "Manuel", apellido: "Vargas", fechaNacimiento: "2014-07-02", sexo: "M", foto: "" },
  { id: 17, nombre: "Tobías", apellido: "Ludueña", fechaNacimiento: "2009-11-30", sexo: "M", foto: "" },
  { id: 18, nombre: "Oriana", apellido: "Cabrera", fechaNacimiento: "2008-02-18", sexo: "F", foto: "" },
  { id: 19, nombre: "Thiago", apellido: "Lencina", fechaNacimiento: "2010-09-05", sexo: "M", foto: "" },
  { id: 20, nombre: "Octavio", apellido: "Cabrera", fechaNacimiento: "2012-06-28", sexo: "M", foto: "" },
  { id: 21, nombre: "Mauro", apellido: "Suárez", fechaNacimiento: "2009-03-12", sexo: "M", foto: "" },
  { id: 22, nombre: "Marco", apellido: "Pella Sycz", fechaNacimiento: "2009-08-22", sexo: "M", foto: "" },
  { id: 23, nombre: "Candelaria", apellido: "Mendoza", fechaNacimiento: "2013-01-10", sexo: "F", foto: "" },
  { id: 24, nombre: "Thiago", apellido: "Villena", fechaNacimiento: "2013-05-17", sexo: "M", foto: "" },
  { id: 25, nombre: "Valentino", apellido: "Gómez", fechaNacimiento: "2012-10-08", sexo: "M", foto: "" },
  { id: 26, nombre: "Mateo", apellido: "Rolón", fechaNacimiento: "2014-04-03", sexo: "M", foto: "" },
  { id: 27, nombre: "Emma", apellido: "Ochandorena", fechaNacimiento: "2013-09-25", sexo: "F", foto: "" },
  { id: 28, nombre: "Abril", apellido: "Rodríguez", fechaNacimiento: "2012-07-14", sexo: "F", foto: "" },
  { id: 29, nombre: "Renzo", apellido: "Rodríguez", fechaNacimiento: "2011-12-20", sexo: "M", foto: "" },
  { id: 30, nombre: "Lautaro", apellido: "Gómez", fechaNacimiento: "2010-03-05", sexo: "M", foto: "" },
];

export function newAct() {
  const today = new Date();
  const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    id: null,
    fecha: new Date().toISOString().slice(0, 10),
    titulo: "",
    cantEquipos: 4,
    locked: false,
    equipos: {},
    asistentes: [],
    puntuales: [],
    biblias: [],
    juegos: [],
    partidos: [],
    invitaciones: [],
    invitados: [],
    goles: [],
    extras: [],
    descuentos: [],
    socials: [],
  };
}

export function newPart() {
  return {
    id: 0,
    nombre: "",
    apellido: "",
    sexo: "M",
    fechaNacimiento: null,
    foto: null,
    fotoAltaCalidad: null,
    invitadoPor: null,
  };
}
