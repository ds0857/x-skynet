/** Fixture: plugin with onLoad and onUnload hooks — tracks calls via globalThis */
export const plugin = {
  name: 'hooks-plugin',
  version: '1.0.0',
  tools: [
    {
      name: 'hook-tool',
      description: 'Tool for hook testing',
      parameters: {},
      execute: async () => ({ success: true }),
    },
  ],
  onLoad: async (ctx: unknown) => {
    const g = globalThis as Record<string, unknown>;
    g.__hookPluginOnLoadCount = ((g.__hookPluginOnLoadCount as number) ?? 0) + 1;
    g.__hookPluginLastCtx = ctx;
  },
  onUnload: async () => {
    const g = globalThis as Record<string, unknown>;
    g.__hookPluginOnUnloadCount = ((g.__hookPluginOnUnloadCount as number) ?? 0) + 1;
  },
};
