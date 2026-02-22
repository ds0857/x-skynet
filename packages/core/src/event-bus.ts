import { DomainEvent, ID, ISODateTime } from '@xskynet/contracts'

function nowIso(): ISODateTime {
  return new Date().toISOString() as ISODateTime
}

function randomId(): ID {
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)) as ID
}

export class EventBus {
  private handlers: Map<string, Set<(e: DomainEvent) => void>> = new Map()
  private _history: DomainEvent[] = []
  private maxHistory = 1000

  emit(event: DomainEvent): void {
    const evt: DomainEvent = {
      id: event.id ?? randomId(),
      occurredAt: event.occurredAt ?? nowIso(),
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload,
      metadata: event.metadata,
    }
    this._history.push(evt)
    if (this._history.length > this.maxHistory) this._history.shift()
    const set = this.handlers.get(evt.type)
    if (set) {
      for (const h of [...set]) {
        try {
          h(evt)
        } catch (err) {
          // swallow handler errors to not break event loop
          console.error('Event handler error', err)
        }
      }
    }
  }

  on(type: string, handler: (e: DomainEvent) => void): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    const set = this.handlers.get(type)!
    set.add(handler)
    return () => {
      set.delete(handler)
      if (set.size === 0) this.handlers.delete(type)
    }
  }

  history(limit = 100): DomainEvent[] {
    return this._history.slice(-limit)
  }
}
