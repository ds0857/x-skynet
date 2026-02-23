# X-Skynet — Deployment Guide

This directory contains all deployment configurations for X-Skynet:

| Method | Location | Description |
|--------|----------|-------------|
| Helm Chart | `helm/x-skynet/` | Kubernetes deployment via Helm |
| Docker Compose | `docker-compose.yml` | Local / single-server deployment |
| Raw k8s manifests | `k8s/` | Bare Kubernetes YAML manifests |

---

## 1. Helm Chart

### Prerequisites

- Kubernetes 1.24+
- Helm 3.10+
- `kubectl` configured for your cluster

### Quick Install

```bash
# Add (or package) the chart locally
cd deploy/

# Install with default values
helm install x-skynet helm/x-skynet/ \
  --namespace x-skynet \
  --create-namespace \
  --set secrets.ANTHROPIC_API_KEY=<your-key>

# Install with a custom values file
helm install x-skynet helm/x-skynet/ \
  --namespace x-skynet \
  --create-namespace \
  -f my-values.yaml
```

### Upgrade

```bash
helm upgrade x-skynet helm/x-skynet/ \
  --namespace x-skynet \
  --reuse-values \
  --set image.tag=1.2.0
```

### Uninstall

```bash
helm uninstall x-skynet --namespace x-skynet
```

### Lint / Template Preview

```bash
helm lint helm/x-skynet/
helm template x-skynet helm/x-skynet/ --namespace x-skynet
```

---

## 2. Docker Compose

### Prerequisites

- Docker 24+
- Docker Compose v2

### Start

```bash
# From the repo root
cp .env.example .env          # edit .env with your API keys
docker compose -f deploy/docker-compose.yml up -d

# View logs
docker compose -f deploy/docker-compose.yml logs -f agent
```

### Stop

```bash
docker compose -f deploy/docker-compose.yml down
# Remove volumes too
docker compose -f deploy/docker-compose.yml down -v
```

---

## 3. Raw Kubernetes Manifests

```bash
# Apply in order
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/agent-deployment.yaml
kubectl apply -f deploy/k8s/agent-service.yaml
kubectl apply -f deploy/k8s/agent-hpa.yaml

# Verify
kubectl get all -n x-skynet
```

---

## Environment Variables

### Agent

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `production` | Runtime environment |
| `PORT` | No | `3000` | HTTP server port |
| `LOG_LEVEL` | No | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |
| `AGENT_NAME` | No | `x-skynet-agent` | Human-readable agent identifier |
| `MAX_WORKERS` | No | `4` | Concurrent task worker count |
| `TASK_QUEUE_SIZE` | No | `100` | In-memory task queue capacity |
| `HEARTBEAT_INTERVAL` | No | `30` | Heartbeat interval in seconds |
| `REDIS_URL` | Yes | — | Redis connection string (e.g. `redis://redis:6379`) |
| `ANTHROPIC_API_KEY` | Yes* | — | Anthropic Claude API key |
| `OPENAI_API_KEY` | No | — | OpenAI API key (optional fallback) |
| `DASHSCOPE_API_KEY` | No | — | Alibaba DashScope API key |

> \* At least one LLM API key is required.

### Dashboard

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AGENT_API_URL` | Yes | `http://agent:3000` | Agent service URL |
| `DASHBOARD_SECRET` | Yes | — | Session secret (change in production!) |
| `PORT` | No | `8080` | Dashboard HTTP port |

---

## Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness — returns `200 OK` when process is alive |
| `GET /ready` | Readiness — returns `200 OK` when ready to serve traffic |
| `GET /metrics` | Prometheus metrics (if enabled) |

---

## Scaling (Kubernetes)

The HPA (`k8s/agent-hpa.yaml`) automatically scales between **1 and 6** replicas based on CPU (70%) and memory (80%) utilization.

To manually scale:

```bash
kubectl scale deployment x-skynet-agent --replicas=3 -n x-skynet
```
