import { useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { navigate } from 'astro:transitions/client';
import { PlayerDetailModal } from '../participants/PlayerDetail';
import { Button } from '../ui/button';

/**
 * Wrapper de detalle de jugador para las páginas Astro.
 * @param {{ id: string }} props
 */
export default function PlayerDetailWrapper({ id }) {
  const { db, isLoading: dbLoading } = useApp();

  const participant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    return db.participants.find((p) => p.id === Number(id)) || null;
  }, [id, db?.participants]);

  if (dbLoading || !db || !db.participants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
          <Button
            variant="link"
            onClick={() => { navigate('/participants'); }}
            className="mt-2"
          >
            Volver a jugadores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PlayerDetailModal
      player={participant}
      db={db}
      onEdit={() => { navigate(`/participants/${id}/edit`); }}
      onClose={() => history.back()}
    />
  );
}
