import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';

export type Logger = PinoLogger;

export interface CreateLoggerOptions extends LoggerOptions {
  name?: string;
}

function getLogLevel(): LoggerOptions['level'] | undefined {
  const lvl = process.env.LOG_LEVEL?.toLowerCase();
  // pino valid levels include: fatal, error, warn, info, debug, trace, silent
  const valid = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
  if (lvl && valid.has(lvl)) return lvl as any;
  return undefined;
}

// OpenTelemetry placeholder bindings — to be connected later
export interface OtelContext {
  otelTraceId?: string;
  otelSpanId?: string;
}

export function createLogger(name?: string, options: CreateLoggerOptions = {}): Logger {
  const level = getLogLevel();
  const base: Record<string, unknown> = {};
  if (name) base.name = name;

  const logger = pino({
    level: level ?? options.level ?? 'info',
    base: { ...base, ...(options.base as object) },
    ...options,
  });

  return logger as Logger;
}

export function withOtelContext(logger: Logger, ctx: OtelContext): Logger {
  return logger.child({ otelTraceId: ctx.otelTraceId, otelSpanId: ctx.otelSpanId });
}
