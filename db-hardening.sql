-- ============================================================================
-- Database hardening constraints
-- Apply manually before enabling strict production migration gates.
-- ============================================================================

-- Keep one attendance row per participant/activity.
DELETE FROM activity_participants ap
USING activity_participants duplicate
WHERE ap.activity_id = duplicate.activity_id
  AND ap.participant_id = duplicate.participant_id
  AND ap.id > duplicate.id;

CREATE UNIQUE INDEX IF NOT EXISTS unq_activity_participant
ON activity_participants(activity_id, participant_id);

-- Keep one push subscription per browser endpoint.
DELETE FROM push_subscriptions ps
USING push_subscriptions duplicate
WHERE ps.endpoint = duplicate.endpoint
  AND ps.id > duplicate.id;

CREATE UNIQUE INDEX IF NOT EXISTS unq_push_subscriptions_endpoint
ON push_subscriptions(endpoint);

-- invitado_por should point to an existing participant when present.
UPDATE participants p
SET invitado_por = NULL
WHERE p.invitado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM participants invited_by
    WHERE invited_by.id = p.invitado_por
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'participants_invitado_por_participants_id_fk'
  ) THEN
    ALTER TABLE participants
      ADD CONSTRAINT participants_invitado_por_participants_id_fk
      FOREIGN KEY (invitado_por)
      REFERENCES participants(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

ALTER TABLE participants
  VALIDATE CONSTRAINT participants_invitado_por_participants_id_fk;
