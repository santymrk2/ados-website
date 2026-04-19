import { EventEmitter } from 'events';

// In Astro dev mode, module state might be cleared on HMR.
// Use globalThis to maintain the event emitter across reloads.
const globalForEvents = globalThis as unknown as {
  __activadosEmitter: EventEmitter | undefined;
};

export const eventBus = globalForEvents.__activadosEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.__activadosEmitter = eventBus;
}
