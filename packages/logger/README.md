# @xskynet/logger

Structured logging for X-Skynet, built on pino. Includes environment-driven log level and placeholders for OpenTelemetry correlation fields.

## Install

```bash
pnpm add @xskynet/logger
```

## Usage

```ts
import { createLogger } from '@xskynet/logger';

const logger = createLogger('service-A');
logger.info({ foo: 'bar' }, 'service started');

// Child logger per request
const reqLogger = logger.child({ requestId: 'abc-123' });
reqLogger.debug('handling request');

// LOG_LEVEL controls the level; defaults to info
// export LOG_LEVEL=debug
```

### OpenTelemetry placeholders

The logger supports attaching OTel fields for future tracing correlation.

```ts
import { createLogger } from '@xskynet/logger';

const logger = createLogger('svc');
const withOtel = logger.child({ otelTraceId: 'trace-id', otelSpanId: 'span-id' });
withOtel.info('correlated');
```

Planned: automatic extraction from active OTel context in a follow-up task.
