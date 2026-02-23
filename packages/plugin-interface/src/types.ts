export interface XSkynetPlugin {
  name: string;
  version: string;
  tools: ToolDefinition[];
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(): Promise<void>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult>;
}

export interface PluginContext {
  agentId: string;
  config: Record<string, unknown>;
  logger: { info(msg: string): void; error(msg: string): void };
}

export interface ExecutionContext extends PluginContext {
  runId: string;
  stepId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
}
