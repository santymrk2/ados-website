"use client";

import { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $isAuthenticated, $authLoading, $role } from '@/store/appStore';

async function fetchAuthStatus() {
  try {
    const response = await fetch('/api/auth-check');
    const data = await response.json();
    return data;
  } catch {
    return { authenticated: false, role: null };
  }
}

export function useAuth() {
  const isAuthenticated = useStore($isAuthenticated);
  const isLoading = useStore($authLoading);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAuth = async () => {
      const authData = await fetchAuthStatus();
      if (authData.authenticated) {
        $isAuthenticated.set(true);
        $role.set(authData.role || 'admin');
      } else {
        $isAuthenticated.set(false);
        $role.set('admin');
      }
      $authLoading.set(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (password: string, role: string = 'admin') => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, role })
      });

      const result = await response.json();
      
      if (result.success) {
        $isAuthenticated.set(true);
        $role.set(result.role || role);
        return { success: true, role: result.role };
      }
      return { success: false, error: result.error || 'Contraseña incorrecta' };
    } catch {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    $isAuthenticated.set(false);
    $role.set('admin');
  }, []);

  const isAdmin = useCallback(() => {
    return $role.get() === 'admin';
  }, []);

  const isViewer = useCallback(() => {
    return $role.get() === 'viewer';
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    isViewer,
  };
}