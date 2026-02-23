# xskynet-sdk

> Official Python SDK for the [X-Skynet](https://github.com/ds0857/x-skynet) multi-agent orchestration platform.

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- 🤖 **Agent management** — list agents, query status, send heartbeats
- 📋 **Proposal orchestration** — create and track multi-step agent tasks
- 🎯 **Mission tracking** — high-level mission queries with nested proposals
- 🔄 **Auto-retry** — exponential back-off for transient 5xx / rate-limit errors
- 🔑 **Type-safe models** — `dataclass`-based `Agent`, `Proposal`, `Mission`

---

## Installation

```bash
pip install xskynet-sdk
```

Or from source:

```bash
git clone https://github.com/ds0857/x-skynet.git
cd x-skynet/packages/sdk-py
pip install -e ".[dev]"
```

---

## Quick Start

```python
from xskynet import XSkynetClient

client = XSkynetClient(
    base_url="https://dashboard-ruby-nine-30.vercel.app",
    api_key="your-ops-api-key",
)

# ── Agents ─────────────────────────────────────────────────────────────────

agents = client.list_agents()
for agent in agents:
    print(f"{agent.id:10s}  status={agent.status}  model={agent.model}")

agent = client.get_agent("scout")
print(agent)

# ── Proposals ──────────────────────────────────────────────────────────────

proposal = client.create_proposal(
    title="Competitor Research Q2-2026",
    description="Deep-dive on top 5 competitors and produce a summary report.",
    proposed_by="nova",
    priority="high",
    steps=[
        {
            "title": "Data gathering",
            "assigned_to": "scout",
            "prompt": "Search the web for the latest news about CompetitorX.",
        },
        {
            "title": "Report writing",
            "assigned_to": "quill",
            "prompt": "Summarise scout's findings into a 500-word executive brief.",
        },
    ],
)
print(f"Created proposal: {proposal.id}  status={proposal.status}")

# ── Missions ───────────────────────────────────────────────────────────────

mission = client.get_mission("mission-uuid-here")
print(f"Mission: {mission.title}  ({len(mission.proposals)} proposals)")

# ── Heartbeat ──────────────────────────────────────────────────────────────

client.send_heartbeat("minion", status="healthy")
```

---

## Context Manager

```python
with XSkynetClient(base_url="...", api_key="...") as client:
    agents = client.list_agents()
# HTTP session is closed automatically
```

---

## API Reference

### `XSkynetClient`

| Method | Description |
|---|---|
| `list_agents()` | Return all registered agents |
| `get_agent(agent_id)` | Fetch a single agent |
| `send_heartbeat(agent_id, status)` | Ping agent health |
| `create_proposal(title, description, ...)` | Create a new proposal |
| `list_proposals(status, limit)` | List proposals (optional filter) |
| `get_proposal(proposal_id)` | Fetch a single proposal |
| `get_mission(mission_id)` | Fetch a mission with its proposals |
| `list_missions(limit)` | List all missions |

### Models

| Class | Key Fields |
|---|---|
| `Agent` | `id`, `name`, `status`, `role`, `model`, `last_heartbeat` |
| `Proposal` | `id`, `title`, `description`, `proposed_by`, `priority`, `status`, `steps` |
| `ProposalStep` | `title`, `assigned_to`, `prompt`, `status`, `result` |
| `Mission` | `id`, `title`, `description`, `status`, `proposals` |

---

## Running Tests

```bash
cd packages/sdk-py
pip install -e ".[dev]"
pytest tests/ -v
```

---

## Development

```bash
# Install with dev extras
pip install -e ".[dev]"

# Run tests with coverage
pytest tests/ --cov=xskynet --cov-report=term-missing
```

---

## License

MIT © X-Skynet Project
