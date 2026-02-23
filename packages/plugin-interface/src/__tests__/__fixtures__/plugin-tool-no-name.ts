/** Fixture: plugin with a tool missing its name */
export const plugin = {
  name: 'test',
  version: '1.0.0',
  tools: [{ name: '', description: '', parameters: {}, execute: async () => ({ success: true }) }],
};
