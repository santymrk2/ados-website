import { useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import { useApp } from '../../hooks/useApp';
import { $role } from '../../store/appStore';
import { ParticipantFormModal } from '../participants/ParticipantForm';

/**
 * Wrapper de formulario de participante para las páginas Astro.
 * @param {{ mode: 'new' | 'edit', id?: string }} props
 */
export default function ParticipantFormWrapper({ mode, id }) {
  const { db, saveParticipant, refresh, isLoading: dbLoading } = useApp();
  
  // Check role - redirect if viewer
  const role = useStore($role);
  const isAdmin = role === 'admin';
  
  useEffect(() => {
    if (!isAdmin && (mode === 'edit' || mode === 'new')) {
      // Viewer trying to access edit/new - redirect to view
      navigate(`/participants/${id || ''}`);
    }
  }, [isAdmin, mode, id]);

  const participant = useMemo(() => {
    if (mode !== 'edit' || !id) return null;
    if (!db?.participants?.length) return null;
    const numericId = Number(id);
    return db.participants.find((p) => p.id === numericId) || null;
  }, [mode, id, db?.participants]);

  if (dbLoading || !db || !db.participants) {
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

  if (mode === 'edit' && !participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantFormModal
      db={db}
      initial={participant}
      onClose={() => history.back()}
      onSave={saveParticipant}
    />
  );
}
