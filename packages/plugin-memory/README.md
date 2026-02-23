# @xskynet/plugin-memory

Persistent agent memory plugin for [X-Skynet](https://github.com/ds0857/x-skynet).

Stores key/value pairs in a local JSON file so your agents can recall state
across multiple workflow runs.

---

## Features

- `kind: memory` step with five operations: **set / get / delete / list / search**
- JSON file backend — zero external dependencies
- Simple promise-chain write-lock (thread-safe within a single process)
- Configurable storage path, pretty-print, and TTL-based expiry
- Implements both `StepExecutor` and `MemoryProvider` plugin contracts

---

## Installation

```bash
pnpm add @xskynet/plugin-memory
```

---

## Quick Start

### Register the plugin

```ts
import { createMemoryPlugin } from '@xskynet/plugin-memory';

const plugin = createMemoryPlugin({
  storagePath: '.xskynet/memory.json', // default
  prettyPrint: false,
  autoPruneExpired: true,
});

runtime.registerPlugin(plugin);
```

---

## YAML Workflow Examples

### Save a value

```yaml
version: "1.0"
name: Memory Demo

tasks:
  - id: task-remember
    name: Remember something
    steps:
      - id: step-set
        name: Store API base URL
        kind: memory
        metadata:
          operation: set
          key: config.api.baseUrl
          value: "https://api.example.com/v2"
          label: "API base URL for production"
          tags: [config, api]
```

### Read a value

```yaml
      - id: step-get
        name: Retrieve API base URL
        kind: memory
        metadata:
          operation: get
          key: config.api.baseUrl
```

The step result will contain:
```json
{
  "status": "succeeded",
  "metadata": {
    "operation": "get",
    "key": "config.api.baseUrl",
    "found": true,
    "result": "https://api.example.com/v2"
  }
}
```

### Delete a key

```yaml
      - id: step-del
        name: Remove stale key
        kind: memory
        metadata:
          operation: delete
          key: config.api.baseUrl
```

### List all keys

```yaml
      - id: step-list
        name: List all memory keys
        kind: memory
        metadata:
          operation: list
          limit: 50
          offset: 0
```

### Fuzzy search

```yaml
      - id: step-search
        name: Find config entries
        kind: memory
        metadata:
          operation: search
          pattern: "config"
          filterTags: [api]
          limit: 10
```

---

## Step metadata reference

| Field          | Operations         | Type       | Description                                      |
|----------------|--------------------|------------|--------------------------------------------------|
| `operation`    | all                | string     | **Required.** `set \| get \| delete \| list \| search` |
| `key`          | set, get, delete   | string     | Memory key                                       |
| `value`        | set                | any        | Value to persist (JSON-serialisable)             |
| `label`        | set                | string     | Human-readable label for the entry               |
| `tags`         | set                | string[]   | Tags to attach to the entry                      |
| `ttlMs`        | set                | number     | Time-to-live in ms (0 = no expiry)               |
| `pattern`      | search, list       | string     | Substring to match against key / label           |
| `limit`        | list, search       | number     | Max number of results                            |
| `offset`       | list, search       | number     | Pagination offset                                |
| `filterTags`   | list, search       | string[]   | Only return entries containing all listed tags   |
| `filterExpired`| list, search       | boolean    | Default `true` — skip expired entries            |

---

## Storage format

Entries are stored in `.xskynet/memory.json` (by default):

```json
{
  "version": 1,
  "lastModified": "2026-02-23T10:00:00.000Z",
  "entries": {
    "config.api.baseUrl": {
      "key": "config.api.baseUrl",
      "value": "https://api.example.com/v2",
      "createdAt": "2026-02-23T09:00:00.000Z",
      "updatedAt": "2026-02-23T09:00:00.000Z",
      "label": "API base URL for production",
      "tags": ["config", "api"]
    }
  }
}
```

---

## Programmatic usage

```ts
import { FileStore } from '@xskynet/plugin-memory';

const store = new FileStore({ storagePath: '.xskynet/memory.json' });

await store.set('user.name', 'Alice');
const entry = await store.get('user.name');
console.log(entry?.value); // 'Alice'

const results = await store.search({ pattern: 'user', limit: 10 });
await store.delete('user.name');
await store.clear();
```

---

## License

Apache-2.0 © X-Skynet Contributors
