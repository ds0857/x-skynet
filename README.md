# X-Skynet

> Open-source AI agent orchestration framework — from idea to running agent in 15 minutes.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/ds0857/x-skynet/releases/tag/v0.1.0)
[![CI](https://github.com/ds0857/x-skynet/actions/workflows/ci.yml/badge.svg)](https://github.com/ds0857/x-skynet/actions/workflows/ci.yml)
[![Security](https://github.com/ds0857/x-skynet/actions/workflows/security.yml/badge.svg)](https://github.com/ds0857/x-skynet/actions/workflows/security.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/)

X-Skynet lets you build multi-agent workflows as **directed acyclic graphs (DAGs)**. Each node is a typed plugin (LLM, HTTP, shell, or your own). The runtime handles scheduling, event persistence, and observability — you just wire up the graph.

---

## Quick Links

- Development Plan: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)
- Assignments: [docs/ASSIGNMENTS.md](docs/ASSIGNMENTS.md)
- Templates: [docs/templates/](docs/templates/)
- Deployment: [deploy/README.md](deploy/README.md)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/ds0857/x-skynet.git
cd x-skynet
pnpm install

# 2. Build the CLI
pnpm --filter @xskynet/cli build

# 3. Run the hello-world YAML workflow
node packages/cli/dist/index.js run examples/hello-world/demo.yaml

# or (after linking the bin globally)
xskynet run examples/hello-world/demo.yaml
```

### YAML Workflow Example

Create a `demo.yaml` workflow file and run it directly:

```bash
xskynet run hello-world/demo.yaml
```

A minimal workflow (`examples/hello-world/demo.yaml`):

```yaml
version: "1.0"
name: Hello World

tasks:
  - id: task-greet
    name: Greet
    steps:
      - id: step-echo
        name: Hello, World!
        kind: echo
        metadata:
          message: "Hello, World from X-Skynet! 🚀"

  - id: task-info
    name: System Info
    dependsOn:
      - task-greet
    steps:
      - id: step-date
        name: Show current date
        kind: shell
        command: "echo \"Ran at: $(date)\""
```

**Supported step kinds:**

| Kind    | Description                                      |
|---------|--------------------------------------------------|
| `echo`  | Print a message to stdout (no subprocess)        |
| `shell` | Execute an arbitrary shell command               |

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Runtime** | Executes a DAG of tasks, manages state machine per node |
| **Plugin** | Typed executor (Claude, HTTP, Shell, …) — implement `PluginExecutor` |
| **EventBus** | In-process pub/sub for task lifecycle events |
| **EventStore** | Persists all events — enables replay and audit |
| **CLI** | `xskynet run / dev / logs / status / version` |

---

## Packages

```
packages/
├── core           — Runtime engine, executor, event-bus, event-store
├── contracts      — Shared TypeScript interfaces and OpenAPI schema
├── cli            — xskynet CLI (init / run / dev / logs / status)
├── logger         — Structured logging (pino + OpenTelemetry placeholder)
├── plugin-claude    — Claude / DashScope LLM executor
├── plugin-http      — Generic HTTP call executor
├── plugin-shell     — Shell command executor
├── plugin-telegram  — Telegram channel transport + executor (Bot API)
├── plugin-memory    — Persistent agent memory (JSON file backend, set/get/delete/list/search)
├── sdk-js           — JavaScript/TypeScript client SDK
└── sdk-py           — Python client SDK (pip install xskynet)
```

---

## Python SDK

```python
from xskynet import XSkynetClient

client = XSkynetClient(base_url="http://localhost:3847")

# List agents
agents = client.list_agents()

# Create a proposal
proposal = client.create_proposal(
    title="Research task",
    description="Find latest AI papers",
    steps=[{"title": "Search", "assigned_to": "scout", "prompt": "Search arXiv for..."}]
)

# Check mission status
mission = client.get_mission(proposal.mission_id)
print(mission.status)  # 'succeeded'
```

---

## Architecture

```
         ┌─────────────────────────────────────┐
         │              X-Skynet               │
         │                                     │
  Input  │  Proposal → Mission → Steps         │  Events
 ───────►│      ↓           ↓       ↓          │─────────►
         │  Runtime  ──► Executor ──► Plugin   │
         │      │                              │
         │  EventBus ──► EventStore            │
         └─────────────────────────────────────┘
```

---

## Examples

| Example | Description |
|---------|-------------|
| `examples/hello-world` | Minimal agent run loop with shell plugin |
| `examples/research-agent` | Multi-step research flow with Claude + HTTP |

---

## Deployment

X-Skynet supports multiple deployment methods. See the **[`deploy/` directory](deploy/README.md)** for full documentation.

| Method | Guide |
|--------|-------|
| 🐳 **Docker Compose** | [deploy/docker-compose.yml](deploy/docker-compose.yml) — local / single-server |
| ☸️ **Helm Chart** | [deploy/helm/x-skynet/](deploy/helm/x-skynet/) — Kubernetes via Helm |
| 📄 **k8s Manifests** | [deploy/k8s/](deploy/k8s/) — raw Kubernetes YAML |

### Quick deploy with Helm

```bash
helm install x-skynet deploy/helm/x-skynet/ \
  --namespace x-skynet \
  --create-namespace \
  --set secrets.ANTHROPIC_API_KEY=<your-key>
```

### Quick deploy with Docker Compose

```bash
docker compose -f deploy/docker-compose.yml up -d
```

→ **[Full Deployment Guide](deploy/README.md)**

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- **Issues**: Bug reports and feature requests welcome
- **PRs**: Please run `pnpm test` and `pnpm build` before submitting
- **RFCs**: Architecture changes → open a discussion in `docs/rfc/`

---

## License

Apache 2.0 — see [LICENSE](LICENSE)

---

*X-Skynet is the foundation for a decentralized AI collaboration network. [Learn more →](docs/rfc/)*
