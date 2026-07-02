CREATE TABLE IF NOT EXISTS "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"fecha_nacimiento" text,
	"sexo" text DEFAULT 'M' NOT NULL,
	"foto" text,
	"foto_alta_calidad" text,
	"invitado_por" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"titulo" text,
	"cant_equipos" integer DEFAULT 4 NOT NULL,
	"locked" boolean DEFAULT false,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"equipo" text,
	"es_puntual" boolean DEFAULT false,
	"tiene_biblia" boolean DEFAULT false,
	"es_social" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "juegos" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"nombre" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "juego_posiciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"juego_id" integer NOT NULL,
	"equipo" text NOT NULL,
	"posicion" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"deporte" text NOT NULL,
	"genero" text NOT NULL,
	"eq1" text NOT NULL,
	"eq2" text NOT NULL,
	"resultado" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goles" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"participant_id" integer,
	"match_id" integer,
	"team" text,
	"tipo" text NOT NULL,
	"cant" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "extras" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"participant_id" integer,
	"team" text,
	"tipo" text NOT NULL,
	"puntos" integer NOT NULL,
	"motivo" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"invitador_id" integer,
	"invitado_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" text DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "fecha_nacimiento" text;
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "sexo" text DEFAULT 'M' NOT NULL;
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "foto" text;
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "foto_alta_calidad" text;
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "invitado_por" integer;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "titulo" text;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "cant_equipos" integer DEFAULT 4 NOT NULL;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "locked" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "activity_participants" ADD COLUMN IF NOT EXISTS "equipo" text;
--> statement-breakpoint
ALTER TABLE "activity_participants" ADD COLUMN IF NOT EXISTS "es_puntual" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "activity_participants" ADD COLUMN IF NOT EXISTS "tiene_biblia" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "activity_participants" ADD COLUMN IF NOT EXISTS "es_social" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "goles" ADD COLUMN IF NOT EXISTS "match_id" integer;
--> statement-breakpoint
ALTER TABLE "goles" ADD COLUMN IF NOT EXISTS "team" text;
--> statement-breakpoint
ALTER TABLE "goles" ADD COLUMN IF NOT EXISTS "cant" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "extras" ADD COLUMN IF NOT EXISTS "team" text;
--> statement-breakpoint
ALTER TABLE "extras" ADD COLUMN IF NOT EXISTS "motivo" text;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "created_at" text DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') NOT NULL;
--> statement-breakpoint
UPDATE "participants" p
SET "invitado_por" = NULL
WHERE p."invitado_por" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM "participants" invited_by
		WHERE invited_by."id" = p."invitado_por"
	);
--> statement-breakpoint
DELETE FROM "activity_participants" ap
USING "activity_participants" duplicate
WHERE ap."activity_id" = duplicate."activity_id"
	AND ap."participant_id" = duplicate."participant_id"
	AND ap."id" > duplicate."id";
--> statement-breakpoint
DELETE FROM "push_subscriptions" ps
USING "push_subscriptions" duplicate
WHERE ps."endpoint" = duplicate."endpoint"
	AND ps."id" > duplicate."id";
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'participants_invitado_por_participants_id_fk'
	) THEN
		ALTER TABLE "participants"
			ADD CONSTRAINT "participants_invitado_por_participants_id_fk"
			FOREIGN KEY ("invitado_por")
			REFERENCES "public"."participants"("id")
			ON DELETE SET NULL
			NOT VALID;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'activity_participants_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "activity_participants"
			ADD CONSTRAINT "activity_participants_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'activity_participants_participant_id_participants_id_fk'
	) THEN
		ALTER TABLE "activity_participants"
			ADD CONSTRAINT "activity_participants_participant_id_participants_id_fk"
			FOREIGN KEY ("participant_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'juegos_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "juegos"
			ADD CONSTRAINT "juegos_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'juego_posiciones_juego_id_juegos_id_fk'
	) THEN
		ALTER TABLE "juego_posiciones"
			ADD CONSTRAINT "juego_posiciones_juego_id_juegos_id_fk"
			FOREIGN KEY ("juego_id")
			REFERENCES "public"."juegos"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'partidos_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "partidos"
			ADD CONSTRAINT "partidos_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'goles_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "goles"
			ADD CONSTRAINT "goles_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'goles_participant_id_participants_id_fk'
	) THEN
		ALTER TABLE "goles"
			ADD CONSTRAINT "goles_participant_id_participants_id_fk"
			FOREIGN KEY ("participant_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'extras_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "extras"
			ADD CONSTRAINT "extras_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'extras_participant_id_participants_id_fk'
	) THEN
		ALTER TABLE "extras"
			ADD CONSTRAINT "extras_participant_id_participants_id_fk"
			FOREIGN KEY ("participant_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'invitaciones_activity_id_activities_id_fk'
	) THEN
		ALTER TABLE "invitaciones"
			ADD CONSTRAINT "invitaciones_activity_id_activities_id_fk"
			FOREIGN KEY ("activity_id")
			REFERENCES "public"."activities"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'invitaciones_invitador_id_participants_id_fk'
	) THEN
		ALTER TABLE "invitaciones"
			ADD CONSTRAINT "invitaciones_invitador_id_participants_id_fk"
			FOREIGN KEY ("invitador_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'invitaciones_invitado_id_participants_id_fk'
	) THEN
		ALTER TABLE "invitaciones"
			ADD CONSTRAINT "invitaciones_invitado_id_participants_id_fk"
			FOREIGN KEY ("invitado_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'push_subscriptions_participant_id_participants_id_fk'
	) THEN
		ALTER TABLE "push_subscriptions"
			ADD CONSTRAINT "push_subscriptions_participant_id_participants_id_fk"
			FOREIGN KEY ("participant_id")
			REFERENCES "public"."participants"("id")
			ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "participants" VALIDATE CONSTRAINT "participants_invitado_por_participants_id_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unq_activity_participant" ON "activity_participants" USING btree ("activity_id","participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_participants_activity_id" ON "activity_participants" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_participants_participant_id" ON "activity_participants" USING btree ("participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_participants_equipo" ON "activity_participants" USING btree ("equipo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_extras_activity_id" ON "extras" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_extras_participant_id" ON "extras" USING btree ("participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_extras_team" ON "extras" USING btree ("team");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_goles_activity_id" ON "goles" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_goles_participant_id" ON "goles" USING btree ("participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_goles_team" ON "goles" USING btree ("team");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_goles_tipo" ON "goles" USING btree ("tipo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitaciones_activity_id" ON "invitaciones" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitaciones_invitador_id" ON "invitaciones" USING btree ("invitador_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitaciones_invitado_id" ON "invitaciones" USING btree ("invitado_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unq_juego_equipo" ON "juego_posiciones" USING btree ("juego_id","equipo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_juego_posiciones_juego_id" ON "juego_posiciones" USING btree ("juego_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_juegos_activity_id" ON "juegos" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partidos_activity_id" ON "partidos" USING btree ("activity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partidos_deporte" ON "partidos" USING btree ("deporte");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unq_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_participant_id" ON "push_subscriptions" USING btree ("participant_id");
