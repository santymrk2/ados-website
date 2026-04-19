"use client";

import { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $isAuthenticated, $authLoading, $role } from '@/store/appStore';

const AUTH_KEY = 'activados_auth';

export function useAuth() {
  const isAuthenticated = useStore($isAuthenticated);
  const isLoading = useStore($authLoading);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      try {
        const { validUntil, role } = JSON.parse(savedAuth);
        if (new Date(validUntil) > new Date()) {
          $isAuthenticated.set(true);
          $role.set(role || 'admin');
        } else {
          localStorage.removeItem(AUTH_KEY);
          $isAuthenticated.set(false);
          $role.set('admin');
        }
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    $authLoading.set(false);
  }, []);

  const login = useCallback(async (password: string, role: string = 'admin') => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, role })
      });

      const result = await response.json();
      
      if (result.success) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 1);
        const userRole = result.role || role;
        localStorage.setItem(AUTH_KEY, JSON.stringify({ 
          validUntil: validUntil.toISOString(),
          role: userRole 
        }));
        $isAuthenticated.set(true);
        $role.set(userRole);
        return { success: true, role: userRole };
      }
      return { success: false, error: result.error || 'Contraseña incorrecta' };
    } catch (e) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEY);
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