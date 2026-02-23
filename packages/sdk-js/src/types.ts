export interface ClientOptions {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

export interface CreatePlanOptions {
  name: string
  description?: string
  tasks?: Array<{ name: string; steps: Array<{ name: string; executor: string; config?: unknown }> }>
}
