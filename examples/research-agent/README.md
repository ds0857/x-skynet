# Research Agent Example

This example demonstrates a research‑oriented agent that:
- Decomposes a goal into parallelizable tasks
- Uses StepExecutors provided by plugins (e.g., web fetch, LLM calls)
- Aggregates artifacts and emits DomainEvents for observability

## Scenario

Given a topic, the agent will:
1. Generate a research plan
2. Fetch and summarize key sources
3. Consolidate findings into a brief

## How to run (conceptual)

- Install workspace deps with pnpm
- Enable plugins by adding them to your app loader
- Create a Plan with Tasks and Steps that map to available StepExecutor kinds

## Key ideas

- Plugin‑first: all concrete capabilities come from plugins implementing contracts in `@xskynet/contracts`
- Composability: Steps are atomic, enabling parallel fan‑out and deterministic fan‑in
- Observability: Transports emit DomainEvents for tracing and metrics
