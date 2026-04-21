"use client";

import { useEffect, useCallback, useMemo } from 'react';
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
} from '@/lib/db-utils';

export function useDatabase() {
  const participants = useStore($participants);
  const activities = useStore($activities);
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);
  const rankings = useStore($rankings);

  // Función de refresh - llama al store que ya maneja SSE automáticamente
  const refresh = useCallback(async () => {
    await refreshData();
  }, []);

  // Guardar actividad - NO hace refresh local here porque SSE lo hace por nosotros
  // Y por SSE todos los clientes (incluído este) reciben la actualización
  const saveActivity = useCallback(async (activity: any, isNew: boolean) => {
    const id = await dbSaveActivity(activity, isNew);
    // NO hacemos refresh aquí - SSE notificará a todos los clientes automáticamente
    // Esto evita el double refresh y hace que la UI sea más responsiva
    return id;
  }, []);

  // Eliminar actividad
  const deleteActivity = useCallback(async (id: number) => {
    await dbDeleteActivity(id);
    // NO hacemos refresh aquí - SSE notificará a todos los clientes automáticamente
  }, []);

  // Quick update (asistencia, equipos, etc)
  const quickUpdate = useCallback(async (activityId: number, type: string, data: any, skipRefresh = false) => {
    const result = await quickUpdateActivity(activityId, type, data);
    if (!skipRefresh) {
      // Solo refresh si explicitly pedido
      // Sino SSE se encarga
    }
    return result;
  }, []);

  // Guardar participante
  const saveParticipant = useCallback(async (participant: any, isNew: boolean, invitadorId: number | null = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    // NO hacemos refresh aquí - SSE notificará a todos los clientes automáticamente
    return id;
  }, []);

  // Eliminar participante
  const deleteParticipant = useCallback(async (id: number) => {
    await dbDeleteParticipant(id);
    // NO hacemos refresh aquí - SSE notificará a todos los clientes automáticamente
  }, []);

  const db = useMemo(() => ({
    participants,
    activities,
    rankings,
    nextPid: Math.max(0, ...participants.map((p: any) => p.id)) + 1,
    nextAid: Math.max(0, ...activities.map((a: any) => a.id)) + 1,
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