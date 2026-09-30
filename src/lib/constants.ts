import { getTodayDateString } from "./utils";
export const TEAMS = ["E1", "E2", "E3", "E4", "E5", "E6"];

// Team names/colors live in src/lib/team-display.ts (shared defaults + per-activity overrides).

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
  return {
    id: null,
    fecha: getTodayDateString(),
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
    telefono: null,
    foto: null,
    fotoAltaCalidad: null,
    invitadoPor: null,
  };
}
