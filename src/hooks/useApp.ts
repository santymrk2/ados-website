"use client";

import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useAuth } from './useAuth';
import { useDatabase } from './useDatabase';
import { $showSettings, $showNotifications, $dbError, $dbConnected, $dbChecked } from '@/store/appStore';

export function useApp() {
  const showSettings = useStore($showSettings);
  const setShowSettings = (val: boolean) => $showSettings.set(val);
  const showNotifications = useStore($showNotifications);
  const setShowNotifications = (val: boolean) => $showNotifications.set(val);
  const dbError = useStore($dbError);
  const dbConnected = useStore($dbConnected);
  const dbChecked = useStore($dbChecked);
  
  const { isAuthenticated, isLoading: authLoading, login, logout: authLogout, isAdmin, isViewer } = useAuth();
  const { db, isLoading: dbLoading, saveActivity, deleteActivity, quickUpdate, saveParticipant, deleteParticipant, refresh } = useDatabase();

  const isLoading = authLoading || dbLoading;

  const logout = useCallback(() => {
    authLogout();
    setShowSettings(false);
  }, [authLogout]);

  return {
    db,
    isLoading,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    isViewer,
    showSettings,
    setShowSettings,
    showNotifications,
    setShowNotifications,
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