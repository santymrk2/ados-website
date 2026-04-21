import { SEED_PARTICIPANTS, newAct } from './constants';

const API_BASE = '/api';

export async function checkDatabaseConnection() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'No se puede conectar a la base de datos');
  }
  return true;
}

export async function getParticipants() {
  const res = await fetch(`${API_BASE}/participants`);
  if (!res.ok) throw new Error('Failed to fetch participants');
  const json = await res.json();
  // Handle both old format (array) and new format ({ success, data })
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function getParticipant(id: number) {
  const res = await fetch(`${API_BASE}/participants/${id}`);
  if (!res.ok) throw new Error('Failed to fetch participant');
  const json = await res.json();
  return Array.isArray(json) ? json[0] : json.data ?? json;
}

export async function getActivities() {
  const res = await fetch(`${API_BASE}/activities`);
  if (!res.ok) throw new Error('Failed to fetch activities');
  const json = await res.json();
  // Handle both old format (array) and new format ({ success, data })
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function saveActivity(activity: any, isNewProvided?: boolean) {
  const isNew = isNewProvided !== undefined ? isNewProvided : !activity.id;
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: activity, isNew }),
  });
  if (res.status === 409) {
    const errorData = await res.json();
    throw new Error(`VERSION_CONFLICT:${errorData.currentVersion}`);
  }
  if (!res.ok) throw new Error('Failed to save activity');
  const result = await res.json();
  return isNew ? result.id : activity.id;
}

export async function quickUpdateActivity(activityId: number, type: string, data: any) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, type, data }),
  });
  if (!res.ok) throw new Error('Failed to quick update activity');
  return res.json();
}

export async function deleteActivity(id: number) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete activity');
}

export async function saveParticipant(participant: any, isNew: boolean, invitadorId: number | null = null) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: participant, isNew, invitadorId }),
  });
  if (!res.ok) throw new Error('Failed to save participant');
  const result = await res.json();
  return isNew ? result.id : participant.id;
}

export async function deleteParticipant(id: number) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete participant');
}
