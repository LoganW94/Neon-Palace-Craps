export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.replay = [];
  }

  on(type, handler) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return () => handlers.delete(handler);
  }

  emit(type, payload) {
    const event = { id: crypto.randomUUID(), type, payload, at: new Date().toISOString() };
    this.replay.unshift(event);
    this.replay = this.replay.slice(0, 200);
    (this.listeners.get(type) ?? []).forEach((handler) => handler(event));
    (this.listeners.get("*") ?? []).forEach((handler) => handler(event));
    return event;
  }
}
