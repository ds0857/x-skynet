/**
 * Claude plugin configuration
 */
export interface ClaudeConfig {
  /**
   * Anthropic API key or compatible provider key (e.g., DashScope)
   */
  apiKey: string

  /**
   * Base URL for the API endpoint
   * Default: 'https://api.anthropic.com' (official Anthropic)
   * For DashScope: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
   */
  baseURL?: string

  /**
   * Default model to use
   * Default: 'claude-3-5-sonnet-20241022'
   */
  model?: string
}
