import { StepExecutor, XSkynetPlugin } from '@xskynet/contracts'

export class PluginRegistry {
  private plugins: XSkynetPlugin[] = []
  private executors: Map<string, StepExecutor> = new Map()

  register(plugin: XSkynetPlugin): void {
    this.plugins.push(plugin)
    if (plugin.executors) {
      for (const ex of plugin.executors) {
        this.executors.set(ex.kind, ex)
      }
    }
  }

  getExecutor(kind: string): StepExecutor | undefined {
    return this.executors.get(kind)
  }

  listPlugins(): XSkynetPlugin[] {
    return [...this.plugins]
  }
}
