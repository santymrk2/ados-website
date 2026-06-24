"use client";

import { useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  $participants,
  $activities,
  $rankings,
  $dbLoading,
  $dbError,
  $dataVersion,
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

type ActivityDraft = Omit<Activity, "id"> & {
  id?: number | null;
};

const RETRYABLE_QUICK_UPDATE_TYPES = new Set([
  "attendance",
  "puntuales",
  "biblias",
  "team",
  "socials",
  "goal_add",
  "goal_remove",
  "goal_update",
  "extra_add",
  "extra_update",
  "extra_delete",
  "extra_toggle",
  "game_add",
  "game_update",
  "game_delete",
  "invitacion_add",
  "invitacion_update",
  "invitacion_delete",
]);

export function useDatabase() {
  // Always provide default values to prevent undefined errors
  const participants = useStore($participants) ?? [];
  const activities = useStore($activities) ?? [];
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);
  const rankings = useStore($rankings) ?? [];
  const dataVersion = useStore($dataVersion) ?? 0;

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
  const quickUpdate = useCallback(async (activityId: number, type: string, data: unknown, version?: number, skipRefresh = false) => {
    const perform = async (currentVersion?: number) => quickUpdateActivity(activityId, type, data, currentVersion);

    try {
      const result = await perform(version);
      if (!skipRefresh) {
        await refreshData(false);
      }
      return result;
    } catch (error) {
      const isConflict = error instanceof Error && error.message.startsWith("VERSION_CONFLICT:");

      if (isConflict && RETRYABLE_QUICK_UPDATE_TYPES.has(type)) {
        await refreshData(false);
        const freshVersion = $activities.get().find((activity) => activity.id === activityId)?.version;
        const retriedResult = await perform(freshVersion);
        if (!skipRefresh) {
          await refreshData(false);
        }
        return retriedResult;
      }

      if (isConflict) {
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
  }), [participants, activities, rankings, dataVersion]);

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
