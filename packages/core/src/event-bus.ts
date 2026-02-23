import { DomainEvent, ID, ISODateTime } from '@xskynet/contracts'
import { EventStore, FileEventStore, InMemoryEventStore, ListOptions, EventFilter } from './event-store'

function nowIso(): ISODateTime {
  return new Date().toISOString() as ISODateTime
}

function randomId(): ID {
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)) as ID
}

export type SubscriptionFilter = EventFilter
export type EventHandler = (e: DomainEvent) => void

export interface EventBusOptions {
  store?: EventStore
  persist?: boolean // default: true
  filePath?: string // used when creating default FileEventStore
  maxHistory?: number // in-memory cache for quick recent lookup
}

interface Subscription {
  filter?: SubscriptionFilter
  handler: EventHandler
}

export class EventBus {
  private subs: Set<Subscription> = new Set()
  private _history: DomainEvent[] = []
  private maxHistory: number
  private store: EventStore

  constructor(opts?: EventBusOptions) {
    this.maxHistory = opts?.maxHistory ?? 1000
    const persist = opts?.persist !== false
    this.store = opts?.store ?? (persist ? new FileEventStore(opts?.filePath) : new InMemoryEventStore())
  }

  private dispatch(evt: DomainEvent, replayed = false): void {
    const deliverEvt: DomainEvent = replayed
      ? ({ ...evt, metadata: { ...(evt.metadata ?? {}), replayed: true } } as DomainEvent)
      : evt
    for (const sub of this.subs) {
      if (!sub.filter || matches(deliverEvt, sub.filter)) {
        try {
          sub.handler(deliverEvt)
        } catch (err) {
          // swallow handler errors to not break event loop
          console.error('Event handler error', err)
        }
      }
    }
  }

  emit(event: DomainEvent): void {
    const evt: DomainEvent = {
      id: event.id ?? randomId(),
      occurredAt: event.occurredAt ?? nowIso(),
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload,
      metadata: event.metadata,
    }
    // in-memory history cache
    this._history.push(evt)
    if (this._history.length > this.maxHistory) this._history.shift()
    // persist
    this.store.append(evt)
    // notify
    this.dispatch(evt, false)
  }

  // Backward compatible: subscribe by type
  on(typeOrFilter: string | SubscriptionFilter, handler: (e: DomainEvent) => void): () => void {
    const filter: SubscriptionFilter = typeof typeOrFilter === 'string' ? { type: typeOrFilter } : typeOrFilter
    const sub: Subscription = { filter, handler }
    this.subs.add(sub)
    return () => {
      this.subs.delete(sub)
    }
  }

  // Explicit filtered subscription API (alias of on)
  subscribe(filter: SubscriptionFilter, handler: (e: DomainEvent) => void): () => void {
    return this.on(filter, handler)
  }

  // Return recent in-memory events
  history(limit = 100): DomainEvent[] {
    return this._history.slice(-limit)
  }

  // Query persisted events directly
  list(options?: ListOptions): DomainEvent[] {
    return this.store.list(options)
  }

  // Replay events from the store to current subscribers without re-persisting
  replay(options: ListOptions & { asOfNow?: boolean } = {}): number {
    const events = this.store.list(options)
    for (const evt of events) this.dispatch(evt, true)
    return events.length
  }
}

function matches(e: DomainEvent, f: SubscriptionFilter): boolean {
  // type filter
  if (f.type) {
    if (Array.isArray(f.type)) {
      if (!f.type.includes(e.type)) return false
    } else if (e.type !== f.type) return false
  }
  // aggregateId filter
  if (f.aggregateId && e.aggregateId !== f.aggregateId) return false
  // source filter inside metadata.source
  if (f.source) {
    const src = (e.metadata?.source as string | undefined) ?? undefined
    if (Array.isArray(f.source)) {
      if (!src || !f.source.includes(src)) return false
    } else if (src !== f.source) return false
  }
  return true
}
