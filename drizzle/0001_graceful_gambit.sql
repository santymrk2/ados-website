ALTER TABLE "juego_posiciones" ALTER COLUMN "equipo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "juego_posiciones" ADD COLUMN "participant_id" integer;--> statement-breakpoint
ALTER TABLE "juegos" ADD COLUMN "tipo" text DEFAULT 'grupal' NOT NULL;--> statement-breakpoint
ALTER TABLE "juego_posiciones" ADD CONSTRAINT "juego_posiciones_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_juego_participant" ON "juego_posiciones" USING btree ("juego_id","participant_id");