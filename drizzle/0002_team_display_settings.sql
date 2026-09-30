-- Additive only: creates two new tables, never alters or rewrites existing data.
-- Idempotent (IF NOT EXISTS) so it is safe on databases partially managed with db:push.
CREATE TABLE IF NOT EXISTS "activity_team_settings" (
	"activity_id" integer PRIMARY KEY NOT NULL,
	"teams" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- "telefono" was added to the schema via db:push without a migration; production already has it.
-- Kept here only to bring the migration history in sync, and guarded so it is a no-op there.
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "telefono" text;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_team_settings_activity_id_activities_id_fk'
  ) THEN
    ALTER TABLE "activity_team_settings"
      ADD CONSTRAINT "activity_team_settings_activity_id_activities_id_fk"
      FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
