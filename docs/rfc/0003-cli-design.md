# RFC-0003: X‑Skynet CLI 设计

- 状态: 草案 (Draft)
- 作者: Mute (X‑Skynet Dev)
- 创建日期: 2026-02-22
- 目标版本: @xskynet/cli 0.1.0

## 背景与目标

X‑Skynet 需要一个开箱即用的命令行工具，帮助开发者在 15 分钟内从零到看到第一个可运行的 Agent 输出（init → run → see output）。CLI 必须：
- 简单直观：核心命令不超过 7 个；
- 稳定可靠：明确的退出码与错误语义；
- 一致输出：同时支持人类可读与 JSON 流；
- 渐进增强：0 配置起步，可通过配置与插件扩展；
- 跨平台：macOS / Linux / Windows（Git Bash/WSL）。

非目标（0.1.0）：
- 不引入云托管/登录流程（后续 `xskynet cloud`）；
- 不内置复杂模板市场（先内置官方模板若干个）。

## 命令设计总览

顶级命令：
- xskynet init [name] — 初始化新项目（从模板）
- xskynet run <agent-file> — 运行本地 Agent 源文件
- xskynet dev — 开发模式（热重载）
- xskynet logs [agent-id] [--follow] — 查看日志（本地运行或后台进程）
- xskynet agents list/status/stop — 本地 Agent 进程管理
- xskynet version — 打印版本信息

全局选项（任何命令可用）：
- --config <path> 指定配置文件（默认自动发现：xskynet.config.{ts,js,mjs,cjs,json,yml,yaml}）
- --verbose 提升日志详细级别（DEBUG）
- --json 以 JSON Lines 输出事件/日志（机器可读）
- --no-color 禁用彩色输出（遵循 NO_COLOR）

优先级（从高到低）：命令行 > 环境变量 > 配置文件 > 默认值。

## 输出格式标准

CLI 统一支持两种输出模式：
- 人类可读（默认）：
  - 结构化但面向阅读，按 level/时间/作用域着色；
  - 多行信息（例如错误堆栈）以缩进方式展开；
- JSON 模式（--json）：
  - 每行一个 JSON 对象（JSONL），字段建议：
    - ts: ISO 时间戳（或 epoch ms）
    - level: trace|debug|info|warn|error
    - scope: 模块/命令名（如 run/dev/init）
    - event: 事件类型（如 "agent.start"、"log.line"、"build.complete"）
    - msg: 简述（人类可读）
    - data: 任意结构化附加数据
  - 错误以 event=error 并附带 code、stack、hint（如有）。

退出码约定：
- 0 成功；
- 1 通用错误；
- 2 参数/配置错误；
- 130 用户中断（SIGINT）；
- 137 OOM/被杀死；
- 143 SIGTERM 优雅退出。

## 命令详解

### xskynet init [name]
- 作用：初始化新项目目录（默认使用官方模板 basic-agent）。
- 行为：
  - 选择/拉取模板（本地内置 + 远端可选）；
  - 写入 package.json、tsconfig、示例 agent.ts；
  - 可选：自动安装依赖（询问/跳过）。
- 常用选项（未来扩展）：
  - --template <name|git-url> 指定模板
  - --install/--no-install 是否安装依赖
  - --pm <pnpm|npm|yarn|bun> 指定包管理器
- 示例：
```bash
xskynet init my-agent
cd my-agent
pnpm i
xskynet run src/agent.ts
```

### xskynet run <agent-file>
- 作用：运行一个本地 Agent 源文件（TypeScript/JavaScript）。
- 行为：
  - 解析配置（--config 优先）；
  - 编译/变换（如 TS→JS）；
  - 启动 runtime，打印 stdout/stderr/log events；
  - 退出时返回子进程退出码。
- 选项（预留）：
  - --env-file <path> 载入环境变量
  - --timeout <ms> 超时退出
  - --dry-run 仅检查不执行
- 示例：
```bash
xskynet run src/agent.ts
```

### xskynet dev
- 作用：开发模式，监听源文件变化并热重载。
- 行为：
  - 首次启动同 run；
  - 监听文件变更，增量重启；
  - 展示构建/重启原因与耗时。
- 选项：
  - --port <number> 未来可能开放本地可视化面板
- 示例：
```bash
xskynet dev
```

### xskynet logs [agent-id] [--follow]
- 作用：查看本地被托管的 Agent（由 dev 或后台模式产生活动 ID）的日志。
- 行为：
  - 未提供 agent-id 时列出最近的实例并提示选择；
  - --follow 持续流式输出。
- 示例：
```bash
xskynet logs 8f2a... --follow
```

### xskynet agents list|status|stop
- 作用：管理本地运行/托管的 Agent 实例。
- 子命令：
  - list 显示所有活动实例（id、name、uptime、state）
  - status <agent-id> 查看单个实例详情
  - stop <agent-id> 停止实例（优雅退出，超时后强杀）
- 示例：
```bash
xskynet agents list
xskynet agents status 8f2a...
xskynet agents stop 8f2a...
```

### xskynet version
- 作用：打印 CLI 版本与环境信息。
- 输出：
  - 人类可读：版本、Node 版本、平台
  - JSON：{"version":"0.1.0","node":"20.x","platform":"darwin-x64"}

## 配置解析
- 默认查找顺序：工作目录下 xskynet.config.ts/js/json/yml/yaml；
- --config 明确指定时仅使用该文件；
- 支持环境变量注入（.env 优先级低于 --env-file）；
- 配置项示例（演示性质）：
```ts
export default {
  runtime: {
    templateDir: ".xskynet/templates",
  },
  logging: { level: "info" }
}
```

## 示例会话（从 0 到输出）
```bash
# 1) 初始化
xskynet init hello-bot
cd hello-bot
pnpm i

# 2) 本地运行（看到第一条输出）
xskynet run src/agent.ts --verbose

# 3) 开发模式（改码→热重载）
xskynet dev --json | jq -r '.event + ": " + .msg'

# 4) 查看日志/进程
xskynet agents list
xskynet logs --follow
```

## 未来扩展方向
- 模板体系：`xskynet template add|list|use` + 远端模板仓库；
- 打包与部署：`xskynet build`、`xskynet deploy`；
- 云端：`xskynet cloud login|push|logs`；
- 测试：`xskynet test`（脚本化对话用例）；
- 插件：`xskynet plugin add <name>`（命令扩展点与生命周期钩子）。

## 实现备注（0.1.0）
- 使用 commander 作为命令解析；chalk 负责彩色输出；ora 用于交互式进度提示；
- JSON 模式时禁用 spinner 与所有 ANSI 着色；
- 日志统一通过内部 logger 适配，确保人类/JSON 双写一致；
- 严格退出码，错误信息包含 hint 与可能的修复建议。
