"use client";

import { useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  $participants,
  $activities,
  $rankings,
  $dbLoading,
  $dbError,
  refreshData
} from '@/store/appStore';
import {
  saveActivity as dbSaveActivity,
  deleteActivity as dbDeleteActivity,
  saveParticipant as dbSaveParticipant,
  deleteParticipant as dbDeleteParticipant,
  quickUpdateActivity,
} from "@/lib/api-client";
import type { Activity, Participant, DBData } from "@/lib/types";
import { VersionConflictError } from "@/lib/errors";

type ActivityDraft = Omit<Activity, "id"> & {
  id?: number | null;
};

export function useDatabase() {
  const participants = useStore($participants);
  const activities = useStore($activities);
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);
  const rankings = useStore($rankings);
  // Función de refresh - llama al store que ya maneja SSE automáticamente
  const refresh = useCallback(async (forceLoader = false) => {
    await refreshData(forceLoader);
  }, []);

  // Guardar actividad
  const saveActivity = useCallback(async (activity: ActivityDraft, isNew: boolean) => {
    const id = await dbSaveActivity(activity, isNew);
    await refreshData(false);
    return id;
  }, []);

  // Eliminar actividad
  const deleteActivity = useCallback(async (id: number) => {
    await dbDeleteActivity(id);
    await refreshData(false);
  }, []);

  // Quick update (asistencia, equipos, etc)
  // The server never rejects on the activity version; a 409 only comes from the
  // per-resource compare-and-set of config, config_bulk, teams_bulk and game_pos
  // (the resource changed since the client's prev* base). Replaying would
  // overwrite another user's work, so there is no auto-retry: refresh + surface it.
  // Optimistic callers pass skipRefresh: the store already holds the change and
  // the server version; SSE + the periodic resync reconcile the rest. Non-optimistic
  // calls (e.g. _add types, where the server generates the id) still refetch.
  const quickUpdate = useCallback(async (activityId: number, type: string, data: unknown, version?: number, skipRefresh = false) => {
    try {
      const result = await quickUpdateActivity(activityId, type, data, version);
      if (!skipRefresh) await refreshData(false);
      return result;
    } catch (error) {
      if (error instanceof VersionConflictError && !skipRefresh) {
        await refreshData(false);
      }
      throw error;
    }
  }, []);

  // Guardar participante
  const saveParticipant = useCallback(async (participant: Participant, isNew: boolean, invitadorId: number | null = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    await refreshData(false);
    return id;
  }, []);

  // Eliminar participante
  const deleteParticipant = useCallback(async (id: number) => {
    await dbDeleteParticipant(id);
    await refreshData(false);
  }, []);

  const db = useMemo((): DBData => ({
    participants,
    activities,
    rankings,
    nextPid: participants.length > 0 ? Math.max(0, ...participants.map((p) => p.id)) + 1 : 1,
    nextAid: activities.length > 0 ? Math.max(0, ...activities.map((a) => a.id)) + 1 : 1,
  }), [participants, activities, rankings]);

  return {
    db,
    isLoading,
    error,
    refresh,
    saveActivity,
    deleteActivity,
    quickUpdate,
    saveParticipant,
    deleteParticipant,
  };
}
