# Parallel Tasks Example

This example illustrates distributing multiple independent Steps concurrently and then joining their results.

## Flow

1. Fan‑out: create N Steps with specific inputs
2. Execute in parallel using plugin‑provided StepExecutors
3. Fan‑in: wait for all to complete and reduce outputs into a single artifact

## Considerations

- Limit parallelism based on RunContext constraints
- Retries should be handled inside executors and reported via StepResult.stats.retries
- Deterministic reduction ensures reproducible results
