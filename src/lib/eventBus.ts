import { EventEmitter } from 'events';

// Use globalThis to maintain the event emitter across requests and reloads
// This is necessary in production to share the eventBus across the application lifecycle
const globalForEvents = globalThis as unknown as {
  __activadosEmitter: EventEmitter | undefined;
};

export const eventBus = globalForEvents.__activadosEmitter || new EventEmitter();

// Always save to globalThis to persist across requests
globalForEvents.__activadosEmitter = eventBus;

// Allow infinite listeners for SSE connections
eventBus.setMaxListeners(100);
