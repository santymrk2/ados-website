"use client";

import { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useAuth } from './useAuth';
import { useDatabase } from './useDatabase';
import {
  $showSettings,
  $dbError,
  $dbConnected,
  $dbChecked,
} from '@/store/appStore';

export function useApp() {
  const showSettings = useStore($showSettings);
  const dbError = useStore($dbError);
  const dbConnected = useStore($dbConnected);
  const dbChecked = useStore($dbChecked);

  const { isAuthenticated, isLoading: authLoading, login, logout: authLogout, isAdmin, isViewer } = useAuth();
  const { db, isLoading: dbLoading, saveActivity, deleteActivity, quickUpdate, saveParticipant, deleteParticipant, refresh } = useDatabase();

  const isLoading = authLoading || dbLoading;

  // useCallback prevents recreating these functions on every render
  const setShowSettings = useCallback((val: boolean) => {
    $showSettings.set(val);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    $showSettings.set(false);
  }, [authLogout]);

  return {
    db,
    isLoading,
    authLoading,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    isViewer,
    showSettings,
    setShowSettings,
    saveActivity,
    deleteActivity,
    quickUpdate,
    saveParticipant,
    deleteParticipant,
    refresh,
    dbError,
    dbConnected,
    dbChecked,
    dbLoading,
  };
}
