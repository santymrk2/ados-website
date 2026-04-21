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
} from '@/lib/db-utils';

export function useDatabase() {
  // Always provide default values to prevent undefined errors
  const participants = useStore($participants) ?? [];
  const activities = useStore($activities) ?? [];
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);
  const rankings = useStore($rankings) ?? [];
  const dataVersion = useStore($dataVersion) ?? 0;

  // Función de refresh - llama al store que ya maneja SSE automáticamente
  const refresh = useCallback(async () => {
    await refreshData();
  }, []);

  // Guardar actividad - NO hace refresh local aquí porque SSE lo hace por nosotros
  const saveActivity = useCallback(async (activity: any, isNew: boolean) => {
    const id = await dbSaveActivity(activity, isNew);
    // SSE notificará a todos los clientes automáticamente
    return id;
  }, []);

  // Eliminar actividad
  const deleteActivity = useCallback(async (id: number) => {
    await dbDeleteActivity(id);
    // SSE notificará a todos los clientes automáticamente
  }, []);

  // Quick update (asistencia, equipos, etc)
  const quickUpdate = useCallback(async (activityId: number, type: string, data: any, skipRefresh = false) => {
    const result = await quickUpdateActivity(activityId, type, data);
    // SSE se encarga del refresh automáticamente
    return result;
  }, []);

  // Guardar participante
  const saveParticipant = useCallback(async (participant: any, isNew: boolean, invitadorId: number | null = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    // SSE notificará a todos los clientes automáticamente
    return id;
  }, []);

  // Eliminar participante
  const deleteParticipant = useCallback(async (id: number) => {
    await dbDeleteParticipant(id);
    // SSE notificará a todos los clientes automáticamente
  }, []);

  const db = useMemo(() => ({
    participants,
    activities,
    rankings,
    nextPid: participants.length > 0 ? Math.max(0, ...participants.map((p: any) => p.id)) + 1 : 1,
    nextAid: activities.length > 0 ? Math.max(0, ...activities.map((a: any) => a.id)) + 1 : 1,
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