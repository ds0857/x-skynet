/** Fixture: valid plugin with a named 'plugin' export */
export const plugin = {
  name: 'valid-plugin',
  version: '1.0.0',
  tools: [
    {
      name: 'tool-a',
      description: 'Test tool A',
      parameters: {},
      execute: async () => ({ success: true, data: {} }),
    },
  ],
};
