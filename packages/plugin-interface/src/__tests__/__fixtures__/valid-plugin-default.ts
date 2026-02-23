/** Fixture: valid plugin with a default export */
const plugin = {
  name: 'default-export-plugin',
  version: '2.0.0',
  tools: [
    {
      name: 'tool-b',
      description: 'Test tool B',
      parameters: {},
      execute: async () => ({ success: true }),
    },
  ],
};
export default plugin;
