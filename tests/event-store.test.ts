import { describe, expect, test, beforeEach } from '@jest/globals'
import { EventBus } from '@xskynet/core'
import { DomainEvent, ID } from '@xskynet/contracts'
import { InMemoryEventStore, FileEventStore } from '@xskynet/core'
import { rmSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function mkEvent(type: string, aggregateId?: ID, payload?: Record<string, unknown>, meta?: Record<string, unknown>): DomainEvent {
  const now = new Date().toISOString() as any
  return {
    id: (Math.random().toString(36).slice(2) + Date.now().toString(36)) as any,
    type,
    occurredAt: now,
    aggregateId,
    payload,
    metadata: meta,
  }
}

describe('Event persistence layer', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = path.resolve(process.cwd(), '.xskynet-test-' + Math.random().toString(36).slice(2))
    try { rmSync(tmpDir, { recursive: true, force: true } as any) } catch {}
  })

  test('InMemoryEventStore basic append/list and filtering', () => {
    const store = new InMemoryEventStore()
    const bus = new EventBus({ store, persist: false, maxHistory: 10 })

    const e1 = mkEvent('a', 'agg1' as any, { v: 1 }, { source: 'svcA' })
    const e2 = mkEvent('b', 'agg2' as any, { v: 2 }, { source: 'svcB' })
    const e3 = mkEvent('a', 'agg1' as any, { v: 3 }, { source: 'svcA' })

    bus.emit(e1)
    bus.emit(e2)
    bus.emit(e3)

    // history returns recent
    expect(bus.history(2).length).toBe(2)

    // list by type
    const onlyA = bus.list({ filter: { type: 'a' } })
    expect(onlyA.every((e) => e.type === 'a')).toBe(true)

    // list by source
    const fromSvcA = bus.list({ filter: { source: 'svcA' } })
    expect(fromSvcA.every((e) => e.metadata?.source === 'svcA')).toBe(true)

    // list by aggregate
    const agg1 = bus.list({ filter: { aggregateId: 'agg1' as any } })
    expect(agg1.every((e) => e.aggregateId === 'agg1')).toBe(true)
  })

  test('FileEventStore persists to jsonl and can replay', () => {
    const eventsPath = path.join(tmpDir, 'events.jsonl')
    const store = new FileEventStore(eventsPath)
    const bus = new EventBus({ store, persist: true })

    const received: DomainEvent[] = []
    bus.on('x', (e) => received.push(e))

    const e1 = mkEvent('x', 'agg9' as any, { i: 1 }, { source: 'svcX' })
    const e2 = mkEvent('y', 'agg9' as any, { i: 2 }, { source: 'svcY' })
    bus.emit(e1)
    bus.emit(e2)

    // file exists and contains 2 lines
    expect(existsSync(eventsPath)).toBe(true)
    const raw = readFileSync(eventsPath, 'utf8')
    expect(raw.trim().split(/\r?\n/).length).toBe(2)

    // replay only type x
    const replayedCount = bus.replay({ filter: { type: 'x' } })
    expect(replayedCount).toBe(1)
    // subscriber should receive replayed marked events
    expect(received.length).toBe(2) // one from live emit, one from replay
    expect(received[1].metadata?.replayed).toBe(true)
  })

  test('Replay since timestamp', async () => {
    const store = new InMemoryEventStore()
    const bus = new EventBus({ store, persist: false })

    const t0 = new Date().toISOString() as any
    const e1 = mkEvent('a')
    // sleep 5ms
    await new Promise((r) => setTimeout(r, 5))
    const t1 = new Date().toISOString() as any
    const e2 = mkEvent('a')

    bus.emit(e1)
    bus.emit(e2)

    const received: DomainEvent[] = []
    bus.on('a', (e) => received.push(e))
    const replayed = bus.replay({ since: t1 })
    expect(replayed).toBe(1)
    expect(received[0].metadata?.replayed).toBe(true)
  })
})
