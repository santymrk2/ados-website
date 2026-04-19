import { useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import { useApp } from "../../hooks/useApp";
import { $role } from '../../store/appStore';
import { ActivityFormModal } from "../activities/ActivityForm";

/**
 * Wrapper de formulario de actividad para las páginas Astro.
 * @param {{ mode: 'new' | 'edit', id?: string, initialTab?: string }} props
 */
export default function ActivityFormWrapper({ mode, id, initialTab = "info" }) {
  const { db, saveActivity, quickUpdate, saveParticipant, refresh, isLoading: dbLoading } = useApp();

  // Check role - redirect if viewer
  const role = useStore($role);
  const isAdmin = role === 'admin';
  
  useEffect(() => {
    if (!isAdmin && (mode === 'edit' || mode === 'new')) {
      // Viewer trying to access edit/new - redirect to view
      navigate(`/activities/${id || ''}`);
    }
  }, [isAdmin, mode, id]);

  const activity = useMemo(() => {
    if (mode !== "edit" || !id) return null;
    if (!db?.activities?.length) return null;
    return db.activities.find((a) => a.id === Number(id)) || null;
  }, [mode, id, db?.activities]);

  if (dbLoading || !db || !db.activities) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  // Additional check: if viewer, don't render the form
  if (!isAdmin && (mode === 'edit' || mode === 'new')) {
    return null;
  }

  if (mode === 'edit' && !activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <ActivityFormModal
      db={db}
      initial={activity}
      onClose={() => history.back()}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
      initialTab={initialTab}
    />
  );
}
