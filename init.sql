-- Database initialization script for Activados

-- Participants table
CREATE TABLE IF NOT EXISTS "participants" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha_nacimiento" TEXT,
    "sexo" TEXT NOT NULL DEFAULT 'M',
    "foto" TEXT,
    "foto_alta_calidad" TEXT,
    "invitado_por" INTEGER,
    "telefono" TEXT,
    "email" TEXT,
    "apodo" TEXT,
    "-activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS "activities" (
    "id" SERIAL PRIMARY KEY,
    "fecha" TEXT NOT NULL,
    "titulo" TEXT,
    "cant_equipos" INTEGER NOT NULL DEFAULT 4,
    "locked" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity participants (asistentes)
CREATE TABLE IF NOT EXISTS "activity_participants" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "participant_id" INTEGER NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
    "equipo" TEXT,
    "es_puntual" BOOLEAN DEFAULT false,
    "tiene_biblia" BOOLEAN DEFAULT false,
    "es_social" BOOLEAN DEFAULT false,
    UNIQUE("activity_id", "participant_id")
);

-- Juegos (mixed games)
CREATE TABLE IF NOT EXISTS "juegos" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "nombre" TEXT
);

CREATE TABLE IF NOT EXISTS "juego_posiciones" (
    "id" SERIAL PRIMARY KEY,
    "juego_id" INTEGER NOT NULL REFERENCES "juegos"("id") ON DELETE CASCADE,
    "equipo" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    UNIQUE("juego_id", "equipo")
);

-- Partidos
CREATE TABLE IF NOT EXISTS "partidos" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "deporte" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "eq1" TEXT NOT NULL,
    "eq2" TEXT NOT NULL,
    "resultado" TEXT
);

-- Goles
CREATE TABLE IF NOT EXISTS "goles" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "participant_id" INTEGER REFERENCES "participants"("id") ON DELETE CASCADE,
    "match_id" INTEGER,
    "team" TEXT,
    "tipo" TEXT NOT NULL,
    "cant" INTEGER NOT NULL DEFAULT 1
);

-- Extras (puntos extra por puntualidad,etc)
CREATE TABLE IF NOT EXISTS "extras" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "participant_id" INTEGER REFERENCES "participants"("id") ON DELETE CASCADE,
    "team" TEXT,
    "tipo" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "motivo" TEXT
);

-- Invitaciones
CREATE TABLE IF NOT EXISTS "invitaciones" (
    "id" SERIAL PRIMARY KEY,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "invitador_id" INTEGER REFERENCES "participants"("id") ON DELETE CASCADE,
    "invitado_id" INTEGER NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" SERIAL PRIMARY KEY,
    "participant_id" INTEGER REFERENCES "participants"("id") ON DELETE CASCADE,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO "participants" ("nombre", "apellido", "sexo", "fecha_nacimiento") VALUES
    ('Santiago', 'Mercado', 'M', '1995-06-15'),
    ('Juan', 'Perez', 'M', '1990-03-22'),
    ('Maria', 'Gonzalez', 'F', '1992-11-08'),
    ('Ana', 'Lopez', 'F', '1988-07-30'),
    ('Carlos', 'Rodriguez', 'M', '1995-01-12')
ON CONFLICT DO NOTHING;

INSERT INTO "activities" ("fecha", "titulo", "cant_equipos") VALUES
    ('2024-01-15', 'Futbol Mixto', 4),
    ('2024-01-22', 'Handball', 4),
    ('2024-01-29', 'Basquet 3x3', 4)
ON CONFLICT DO NOTHING;