# Phase 5 社区规模化规划文档

> **版本**: v0.1.0-plan  
> **创建日期**: 2026-02-23  
> **负责人**: Nova (nova@ai-company.dev)  
> **状态**: 规划中

---

## 一、Phase 5 目标概述

Phase 5 的核心目标是将 X-Skynet 从内部开发工具转变为公开的、社区驱动的开源项目。通过 npm 发布、GitHub Release、SDK 示例、性能基准测试以及 Discord 社区自动化，建立一个完整的开发者生态系统。

**关键目标**：
- 发布 `@x-skynet/core` 等核心包到 npm registry（v0.1.0）
- 创建完整的 v0.1.0 GitHub Release，包含 changelog 和编译产物
- 提供 TypeScript 和 Python SDK 示例（各3个）
- 建立性能基准测试体系（TPS、延迟、内存占用）
- 搭建 Discord 社区自动化（webhook 通知、bot 指令、频道结构）

---

## 二、npm 发布计划

### 2.1 发布包列表

| 包名 | 描述 | 版本 |
|------|------|------|
| `@x-skynet/core` | 核心运行时、调度器、消息总线 | v0.1.0 |
| `@x-skynet/sdk` | TypeScript SDK，封装高层 API | v0.1.0 |
| `@x-skynet/cli` | CLI 工具（skynet dev/build/deploy） | v0.1.0 |
| `@x-skynet/types` | 公共类型定义（纯类型包） | v0.1.0 |
| `@x-skynet/plugin-discord` | Discord 社区插件 | v0.1.0 |

### 2.2 版本策略

- 遵循 **Semantic Versioning 2.0**（semver）
- v0.1.0 为首个公开可用版本（Alpha 阶段），API 可能变动
- 预发布标签：`v0.1.0-alpha.1`、`v0.1.0-beta.1`
- 正式发布标签：`v0.1.0`

### 2.3 发布流程

```bash
# Step 1: 构建所有包
pnpm build

# Step 2: 运行测试套件，确保全绿
pnpm test

# Step 3: 更新 CHANGELOG.md（conventional commits）
pnpm changeset

# Step 4: 打版本 tag
git tag v0.1.0 && git push origin v0.1.0

# Step 5: 发布到 npm（带 public 访问权限）
pnpm publish --access public --filter @x-skynet/*

# Step 6: 验证发布
npm info @x-skynet/core version
```

### 2.4 npm 配置

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

---

## 三、GitHub Release v0.1.0 计划

### 3.1 Tag 策略

- **轻量 tag**：`v0.1.0`（指向 main 分支最新 commit）
- **注释 tag**：包含签名和发布说明
- **分支保护**：main 分支设为 protected，Release 前需 PR 审核

### 3.2 Release 内容

**标题**：`v0.1.0 — X-Skynet Public Alpha`

**Changelog 摘要**：
```markdown
## What's New in v0.1.0

### ✨ Features
- Core agent runtime with message bus
- TypeScript SDK with full type coverage
- CLI tool: `skynet dev` / `skynet build` / `skynet deploy`
- Plugin system for Discord, webhooks, and custom integrations
- Performance benchmark suite

### 🐛 Bug Fixes
- Fixed race condition in scheduler under high concurrency
- Resolved memory leak in long-running agent sessions

### 📦 Assets
- `x-skynet-v0.1.0-linux-x64.tar.gz`
- `x-skynet-v0.1.0-darwin-arm64.tar.gz`
- `x-skynet-v0.1.0-win32-x64.zip`
- `SBOM.json` (Software Bill of Materials)
```

### 3.3 Release Assets

| 文件 | 描述 |
|------|------|
| `x-skynet-v0.1.0-linux-x64.tar.gz` | Linux x64 预编译二进制 |
| `x-skynet-v0.1.0-darwin-arm64.tar.gz` | macOS ARM64（Apple Silicon）|
| `x-skynet-v0.1.0-win32-x64.zip` | Windows x64 |
| `checksums.sha256` | SHA-256 校验和 |
| `SBOM.json` | 软件物料清单（符合 NTIA 要求）|

---

## 四、SDK 示例计划

### 4.1 TypeScript 示例

#### 示例 1: Hello Agent（基础 Agent 启动）
```typescript
// examples/ts/01-hello-agent.ts
import { SkynetRuntime } from '@x-skynet/sdk';

const runtime = new SkynetRuntime({ name: 'hello-agent', model: 'gpt-4o' });

runtime.on('message', async (ctx) => {
  await ctx.reply(`Echo: ${ctx.message.text}`);
});

await runtime.start();
console.log('Agent is running on port 3000');
```

#### 示例 2: Multi-Agent 协作（消息总线通信）
```typescript
// examples/ts/02-multi-agent.ts
import { SkynetRuntime, MessageBus } from '@x-skynet/sdk';

const bus = new MessageBus();
const agentA = new SkynetRuntime({ name: 'agent-a', bus });
const agentB = new SkynetRuntime({ name: 'agent-b', bus });

agentA.on('task', async (ctx) => {
  const result = await bus.request('agent-b', { type: 'process', data: ctx.payload });
  await ctx.resolve(result);
});

agentB.on('process', async (ctx) => {
  ctx.reply({ processed: true, input: ctx.payload.data });
});

await Promise.all([agentA.start(), agentB.start()]);
```

#### 示例 3: Discord Bot 集成（插件系统）
```typescript
// examples/ts/03-discord-bot.ts
import { SkynetRuntime } from '@x-skynet/sdk';
import { DiscordPlugin } from '@x-skynet/plugin-discord';

const runtime = new SkynetRuntime({ name: 'discord-bot' });

runtime.use(new DiscordPlugin({
  token: process.env.DISCORD_BOT_TOKEN!,
  guildId: process.env.DISCORD_GUILD_ID!,
  commands: [
    { name: 'status', description: 'Check agent status' },
    { name: 'run', description: 'Run a task', options: [{ name: 'task', type: 'STRING', required: true }] },
  ],
}));

runtime.on('discord/command/status', async (ctx) => {
  await ctx.interaction.reply({ content: `✅ Agent ${runtime.name} is online`, ephemeral: true });
});

await runtime.start();
```

### 4.2 Python 示例

#### 示例 1: 基础 Agent（Python SDK 快速入门）
```python
# examples/python/01_hello_agent.py
from x_skynet import SkynetAgent

agent = SkynetAgent(name="hello-agent", model="gpt-4o")

@agent.on_message
async def handle_message(ctx):
    await ctx.reply(f"Echo: {ctx.message.text}")

if __name__ == "__main__":
    agent.run(port=3000)
```

#### 示例 2: 工具调用（Function Calling 集成）
```python
# examples/python/02_tool_calling.py
from x_skynet import SkynetAgent, tool

agent = SkynetAgent(name="tool-agent")

@tool(description="Search the web for information")
async def web_search(query: str) -> str:
    # 实际实现调用搜索 API
    return f"Results for: {query}"

@tool(description="Execute Python code safely")
async def code_exec(code: str) -> dict:
    # 沙盒执行
    return {"output": eval(code), "success": True}

agent.register_tools([web_search, code_exec])

@agent.on_message
async def handle(ctx):
    response = await agent.chat(ctx.message.text, tools=agent.tools)
    await ctx.reply(response.content)

agent.run()
```

#### 示例 3: 批量任务处理（流式输出 + 进度回调）
```python
# examples/python/03_batch_processing.py
from x_skynet import SkynetAgent, BatchProcessor
from typing import AsyncGenerator

agent = SkynetAgent(name="batch-agent")
processor = BatchProcessor(concurrency=10, rate_limit=100)

async def process_item(item: dict) -> dict:
    result = await agent.invoke("summarize", item["text"])
    return {"id": item["id"], "summary": result}

@agent.on_message
async def handle_batch(ctx):
    items = ctx.message.payload["items"]
    async for progress in processor.run(items, process_item):
        await ctx.stream(f"Progress: {progress.completed}/{progress.total}")
    await ctx.reply({"results": processor.results, "elapsed": processor.elapsed_ms})

agent.run()
```

---

## 五、性能基准测试计划

### 5.1 工具选择

| 工具 | 用途 |
|------|------|
| **k6** | HTTP/WebSocket 负载测试，模拟并发 agent 调用 |
| **autocannon** | Node.js 原生 HTTP benchmark（本地低延迟测试）|
| **hyperfine** | CLI 工具启动时间对比（冷启动 vs 热启动）|
| **clinic.js** | Node.js 性能分析（CPU、内存、I/O 火焰图）|
| **pytest-benchmark** | Python SDK 性能基准（异步吞吐量测试）|

### 5.2 指标定义

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| **消息吞吐量 (TPS)** | ≥ 10,000 msg/s | k6 虚拟用户并发发送 |
| **P50 延迟** | ≤ 5ms | autocannon 100 并发 |
| **P99 延迟** | ≤ 50ms | autocannon 100 并发 |
| **内存占用（空闲）** | ≤ 50MB | clinic.js 内存快照 |
| **冷启动时间** | ≤ 200ms | hyperfine 10次平均 |
| **SDK 初始化时间** | ≤ 100ms | 自定义计时脚本 |

### 5.3 基准测试场景

```javascript
// benchmarks/k6/agent-throughput.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp-up
    { duration: '60s', target: 1000 },  // sustained load
    { duration: '30s', target: 0 },     // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<50'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post('http://localhost:3000/api/message', JSON.stringify({
    text: 'benchmark test message',
    agentId: 'test-agent',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

---

## 六、Discord 社区自动化计划

### 6.1 频道结构设计

```
X-Skynet Discord Server
├── 📢 announcements       — 自动发布 npm/GitHub Release 通知
├── 📖 getting-started     — 新手指南，bot 自动回复 FAQ
├── 💬 general             — 社区讨论
├── 🐛 bug-reports         — Issue 提交指引，bot 模板化收集
├── 💡 feature-requests    — 投票功能，bot 汇总到 GitHub Discussions
├── 🚀 showcase            — 社区项目展示
├── 🔧 dev-logs            — CI/CD 构建状态自动推送（webhook）
└── 🤖 bot-commands        — 隔离 bot 指令频道
```

### 6.2 Webhook 通知

**触发器 → Discord 频道映射**：

| 触发器 | 频道 | 消息模板 |
|--------|------|---------|
| npm publish | `#announcements` | `🎉 @x-skynet/core v{version} published to npm!` |
| GitHub Release | `#announcements` | `🚀 X-Skynet {version} released! Changelog: {url}` |
| CI 构建失败 | `#dev-logs` | `❌ Build failed on {branch}: {error}` |
| CI 构建成功 | `#dev-logs` | `✅ Build passed: {commit} — {duration}ms` |
| 新 Issue | `#bug-reports` | `🐛 New issue #{id}: {title}` |

```yaml
# .github/workflows/discord-notify.yml
name: Discord Notification
on:
  release:
    types: [published]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send Discord notification
        uses: Ilshidur/action-discord@master
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
        with:
          args: |
            🚀 **X-Skynet ${{ github.event.release.tag_name }}** has been released!
            📦 npm: `npm install @x-skynet/core@${{ github.event.release.tag_name }}`
            📋 Changelog: ${{ github.event.release.html_url }}
```

### 6.3 Discord Bot 功能设计

**Bot 名称**: `SkynetBot#0857`

| 指令 | 功能 |
|------|------|
| `/status` | 显示最新版本、npm 下载量、GitHub stars |
| `/docs <topic>` | 搜索并返回文档链接 |
| `/benchmark` | 显示最新性能基准测试结果 |
| `/report-bug` | 引导用户填写 Bug 报告模板 |
| `/changelog` | 显示最近3个版本的 changelog |
| `/subscribe` | 订阅版本发布通知（DM）|

---

## 七、时间线和里程碑

| 里程碑 | 目标日期 | 交付物 |
|--------|---------|--------|
| **M1: 核心包稳定** | 2026-03-01 | `@x-skynet/core` 通过所有单元测试，覆盖率 ≥ 80% |
| **M2: SDK 示例完成** | 2026-03-08 | TypeScript + Python 各3个示例，含 README |
| **M3: 基准测试建立** | 2026-03-12 | k6 脚本 + baseline 报告（HTML 格式）|
| **M4: Discord 社区上线** | 2026-03-15 | 频道结构 + Bot 部署 + Webhook 配置 |
| **M5: npm Alpha 发布** | 2026-03-20 | `v0.1.0-alpha.1` 发布到 npm |
| **M6: v0.1.0 正式发布** | 2026-03-31 | GitHub Release + npm publish + 社区公告 |

---

## 八、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| npm 包名被占用 | 低 | 高 | 预先注册 `@x-skynet` scope |
| 性能未达标 | 中 | 中 | 提前2周进行性能优化冲刺 |
| Discord Bot 审核延迟 | 低 | 低 | 提前申请 bot 权限，使用 webhook 作为备选 |
| 社区冷启动缺乏活跃度 | 高 | 中 | 发布前联系种子用户，准备首批内容 |

---

*文档由 Nova 自动生成 — X-Skynet Phase 5 Planning — 2026-02-23*
