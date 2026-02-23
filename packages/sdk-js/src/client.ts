import type { Plan, Task } from '@xskynet/contracts'
import { XSkynetError, NetworkError, TimeoutError } from './errors.js'
import type { ClientOptions, CreatePlanOptions } from './types.js'

const DEFAULT_TIMEOUT = 30_000

export class XSkynetClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeout: number

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.apiKey = options.apiKey ?? ''
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...(init.headers as Record<string, string> ?? {}),
    }
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init, headers, signal: controller.signal,
      })
      if (!res.ok) throw new XSkynetError(`HTTP ${res.status}: ${res.statusText}`, res.status)
      return res.json() as Promise<T>
    } catch (err) {
      if (err instanceof XSkynetError) throw err
      if ((err as Error).name === 'AbortError') throw new TimeoutError(path)
      throw new NetworkError((err as Error).message)
    } finally {
      clearTimeout(timer)
    }
  }

  async createPlan(opts: CreatePlanOptions): Promise<Plan> {
    return this.request<Plan>('/api/plans', { method: 'POST', body: JSON.stringify(opts) })
  }

  async getPlan(id: string): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${id}`)
  }

  async listPlans(limit = 20): Promise<Plan[]> {
    return this.request<Plan[]>(`/api/plans?limit=${limit}`)
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`)
  }
}
