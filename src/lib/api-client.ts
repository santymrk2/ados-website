import type { Activity, Participant } from './types';
import { AppError, VersionConflictError } from './errors';

const API_BASE = '/api';

type ActivityDraft = Omit<Activity, 'id'> & {
  id?: number | null;
};

async function throwResponseError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = await res.json();
    if (typeof data?.error === 'string') message = data.error;
  } catch {
    // Non-JSON body: keep the fallback message
  }
  throw new Error(message);
}

export async function checkDatabaseConnection() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    let errorMessage = `Error del servidor: ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.message) errorMessage = data.message;
    } catch {
      // Si falla el parseo JSON, probablemente sea una página de error HTML (Next.js Error Overlay)
      console.error("Respuesta no-JSON de /api/health:", await res.text().catch(() => ""));
    }
    throw new Error(errorMessage);
  }
  return true;
}

export async function getParticipants() {
  const res = await fetch(`${API_BASE}/participants?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new AppError('Failed to fetch participants', res.status);
  const json = await res.json();
  // Handle both old format (array) and new format ({ success, data })
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function getParticipant(id: number) {
  const res = await fetch(`${API_BASE}/participants/${id}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch participant');
  const json = await res.json();
  return Array.isArray(json) ? json[0] : json.data ?? json;
}

export async function getActivities() {
  const res = await fetch(`${API_BASE}/activities?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new AppError('Failed to fetch activities', res.status);
  const json = await res.json();
  // Handle both old format (array) and new format ({ success, data })
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function saveActivity(activity: ActivityDraft, isNewProvided?: boolean) {
  const isNew = isNewProvided !== undefined ? isNewProvided : !activity.id;
  const payload = isNew
    ? {
        ...activity,
        id: undefined,
      }
    : activity;

  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload, isNew }),
  });
  if (res.status === 409) {
    const errorData = await res.json();
    throw new VersionConflictError(errorData.currentVersion);
  }
  if (!res.ok) return throwResponseError(res, 'Error al guardar la actividad');
  const result = await res.json();
  return isNew ? result.id : activity.id;
}

export async function quickUpdateActivity(activityId: number, type: string, data: unknown, version?: number) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, type, data, version }),
  });
  if (res.status === 409) {
    const errorData = await res.json();
    throw new VersionConflictError(errorData.currentVersion);
  }
  if (!res.ok) return throwResponseError(res, 'Error al actualizar la actividad');
  return res.json();
}

export async function deleteActivity(id: number) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return throwResponseError(res, 'Error al eliminar la actividad');
}

export async function saveParticipant(participant: Participant, isNew: boolean, invitadorId: number | null = null) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: participant, isNew, invitadorId }),
  });
  if (!res.ok) return throwResponseError(res, 'Error al guardar el participante');
  const result = await res.json();
  return isNew ? result.id : participant.id;
}

export async function deleteParticipant(id: number) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return throwResponseError(res, 'Error al eliminar el participante');
}
