import { DomainEvent, ID, ISODateTime } from '@xskynet/contracts'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type EventFilter = {
  type?: string | string[]
  source?: string | string[]
  aggregateId?: ID
}

export interface ListOptions {
  since?: ISODateTime
  until?: ISODateTime
  filter?: EventFilter
  limit?: number
}

export interface EventStore {
  // Persist a single event
  append(event: DomainEvent): void
  // List events matching options (in chronological order)
  list(options?: ListOptions): DomainEvent[]
}

export class InMemoryEventStore implements EventStore {
  private events: DomainEvent[] = []

  append(event: DomainEvent): void {
    this.events.push(event)
  }

  list(options?: ListOptions): DomainEvent[] {
    const { since, until, filter, limit } = options ?? {}
    let out = this.events.slice()
    if (since) out = out.filter((e) => e.occurredAt >= since)
    if (until) out = out.filter((e) => e.occurredAt <= until)
    if (filter) out = out.filter((e) => matchFilter(e, filter))
    out.sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0))
    return typeof limit === 'number' ? out.slice(-limit) : out
  }
}

export class FileEventStore implements EventStore {
  readonly filePath: string

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.resolve(process.cwd(), '.xskynet', 'events.jsonl')
    const dir = path.dirname(this.filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (!existsSync(this.filePath)) {
      // lazily create empty file on first append; no-op here to avoid touching FS unnecessarily
    }
  }

  append(event: DomainEvent): void {
    const line = JSON.stringify(event)
    appendFileSync(this.filePath, line + '\n', { encoding: 'utf8' })
  }

  list(options?: ListOptions): DomainEvent[] {
    const { since, until, filter, limit } = options ?? {}
    if (!existsSync(this.filePath)) return []
    const raw = readFileSync(this.filePath, { encoding: 'utf8' })
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
    let events: DomainEvent[] = []
    for (const l of lines) {
      try {
        const e = JSON.parse(l) as DomainEvent
        events.push(e)
      } catch {
        // skip malformed lines
      }
    }
    if (since) events = events.filter((e) => e.occurredAt >= since)
    if (until) events = events.filter((e) => e.occurredAt <= until)
    if (filter) events = events.filter((e) => matchFilter(e, filter))
    events.sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0))
    return typeof limit === 'number' ? events.slice(-limit) : events
  }
}

function matchFilter(e: DomainEvent, f: EventFilter): boolean {
  if (f.type) {
    if (Array.isArray(f.type)) {
      if (!f.type.includes(e.type)) return false
    } else if (e.type !== f.type) return false
  }
  if (f.aggregateId) {
    if (e.aggregateId !== f.aggregateId) return false
  }
  if (f.source) {
    const src = (e.metadata?.source as string | undefined) ?? undefined
    if (Array.isArray(f.source)) {
      if (!src || !f.source.includes(src)) return false
    } else if (src !== f.source) return false
  }
  return true
}

export const DEFAULT_EVENTS_PATH = path.resolve(process.cwd(), '.xskynet', 'events.jsonl')
