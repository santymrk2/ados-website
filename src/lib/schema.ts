import {
  pgTable,
  integer,
  serial,
  text,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  fechaNacimiento: text("fecha_nacimiento"),
  sexo: text("sexo").notNull().default("M"),
  foto: text("foto"),
  fotoAltaCalidad: text("foto_alta_calidad"),
  invitadoPor: integer("invitado_por"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  fecha: text("fecha").notNull(),
  titulo: text("titulo"),
  cantEquipos: integer("cant_equipos").notNull().default(4),
  locked: boolean("locked").default(false),
  version: integer("version").notNull().default(1),
});

export const activityParticipants = pgTable("activity_participants", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  equipo: text("equipo"),
  esPuntual: boolean("es_puntual").default(false),
  tieneBiblia: boolean("tiene_biblia").default(false),
  esSocial: boolean("es_social").default(false),
});

export const juegos = pgTable("juegos", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  nombre: text("nombre"),
});

export const juegoPosiciones = pgTable(
  "juego_posiciones",
  {
    id: serial("id").primaryKey(),
    juegoId: integer("juego_id")
      .notNull()
      .references(() => juegos.id, { onDelete: "cascade" }),
    equipo: text("equipo").notNull(),
    posicion: integer("posicion").notNull(),
  },
  (table) => ({
    unq_juego_equipo: uniqueIndex("unq_juego_equipo").on(
      table.juegoId,
      table.equipo,
    ),
  }),
);

export const partidos = pgTable("partidos", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  deporte: text("deporte").notNull(),
  genero: text("genero").notNull(),
  eq1: text("eq1").notNull(),
  eq2: text("eq2").notNull(),
  resultado: text("resultado"),
});

export const goles = pgTable("goles", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").references(() => participants.id, {
    onDelete: "cascade",
  }),
  matchId: integer("match_id"),
  team: text("team"),
  tipo: text("tipo").notNull(),
  cant: integer("cant").notNull().default(1),
});

export const extras = pgTable("extras", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").references(() => participants.id, {
    onDelete: "cascade",
  }),
  team: text("team"),
  tipo: text("tipo").notNull(),
  puntos: integer("puntos").notNull(),
  motivo: text("motivo"),
});

export const invitaciones = pgTable("invitaciones", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  invitadorId: integer("invitador_id").references(() => participants.id, {
    onDelete: "cascade",
  }),
  invitadoId: integer("invitado_id").references(() => participants.id, {
    onDelete: "cascade",
  }),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").references(() => participants.id, {
    onDelete: "cascade",
  }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});
