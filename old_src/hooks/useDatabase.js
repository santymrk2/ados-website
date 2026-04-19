import { useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { 
  $participants, 
  $activities, 
  $rankings,
  $dbLoading, 
  $dbError,
  refreshData
} from '../store/appStore';
import {
  saveActivity as dbSaveActivity,
  deleteActivity as dbDeleteActivity,
  saveParticipant as dbSaveParticipant,
  deleteParticipant as dbDeleteParticipant,
  quickUpdateActivity,
} from '../lib/db-utils';

export function useDatabase() {
  const participants = useStore($participants);
  const activities = useStore($activities);
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);

  const refresh = useCallback(async () => {
    await refreshData();
  }, []);

  const saveActivity = useCallback(async (activity, isNew) => {
    const id = await dbSaveActivity(activity, isNew);
    if (isNew) {
      $activities.set([...$activities.get(), { ...activity, id }]);
    } else {
      $activities.set($activities.get().map(a => a.id === id ? { ...a, ...activity } : a));
    }
    await refreshData();
    return id;
  }, []);

  const deleteActivity = useCallback(async (id) => {
    await dbDeleteActivity(id);
    $activities.set($activities.get().filter(a => a.id !== id));
    await refreshData();
  }, []);

  const quickUpdate = useCallback(async (activityId, type, data, skipRefresh = false) => {
    const result = await quickUpdateActivity(activityId, type, data);
    if (!skipRefresh) {
      await refreshData();
    }
    return result;
  }, []);

  const saveParticipant = useCallback(async (participant, isNew, invitadorId = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    if (isNew) {
      $participants.set([...$participants.get(), { ...participant, id }]);
    } else {
      $participants.set($participants.get().map(p => p.id === id ? { ...p, ...participant } : p));
    }
    await refreshData();
    return id;
  }, []);

  const deleteParticipant = useCallback(async (id) => {
    await dbDeleteParticipant(id);
    $participants.set($participants.get().filter(p => p.id !== id));
    await refreshData();
  }, []);

  const rankings = useStore($rankings);

  const db = useMemo(() => ({
    participants,
    activities,
    rankings,
    nextPid: Math.max(0, ...participants.map(p => p.id)) + 1,
    nextAid: Math.max(0, ...activities.map(a => a.id)) + 1,
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
