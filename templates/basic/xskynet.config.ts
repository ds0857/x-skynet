/*
  X-Skynet configuration template.
  Fill in or modify fields as needed. All fields are optional and have sensible defaults.
*/

export default {
  agent: {
    name: 'basic-agent', // Display name for the agent
    description: 'A minimal agent created from the basic template'
  },
  runtime: {
    // model: 'claude-3-7-sonnet-20250219',
    // temperature: 0.2
  },
  plugins: [
    // '@xskynet/plugin-http',
    // '@xskynet/plugin-claude',
  ]
} as const;
