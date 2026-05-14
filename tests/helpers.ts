export function generateUniqueEmail(): string {
  return `test.${Date.now()}@ados.test`;
}

export function generateActivityName(): string {
  return `Actividad Test ${Date.now()}`;
}

export function generateParticipantName(): string {
  return `Participante ${Date.now()}`;
}