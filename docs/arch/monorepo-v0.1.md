# X-Skynet Monorepo 与 Dev Infra 设计稿 v0.1

Status: Proposal for review
Owner: Mute (Deputy GM)
Last Updated: 2026-02-24

本设计稿为 Phase 1（P1-04/06/07/08）的实施蓝图与评审输入，采用"计划先行→PR落地"流程：先在 docs/arch/monorepo-v0.1.md 评审计划，再按提交切分推进实现。

---

## 1. Monorepo 结构（可迭代）

- packages/
  - core: 最小引擎与执行框架（Phase 2 主体）
  - agent: 高阶 Agent 能力与组合（Phase 2/3）
  - cli: 命令行入口（Phase 3），提供 xsk 命令
  - contracts: 公共类型与协议定义（Phase 2）
  - plugin-*: 可插拔执行器（claude/http/shell 等，Phase 3）
  - tsconfig, eslint-config, prettier-config: 可复用工程配置（Phase 1）
- apps/
  - viewer: 运行查看器（Phase 3/4）
- examples/
  - demo: 最小示例，供 Quickstart 与 CI 使用
- docs/
  - arch/: 架构与流程文档
  - Quickstart.md: 快速上手

备注：保持工作区间可独立构建与测试；所有包遵循严格的 peerDependencies 与 workspace:* 约束。

## 2. 工程基建

- 包管理：pnpm workspaces（根锁文件 + 每包独立 tsconfig）
- TypeScript：root tsconfig.base.json，统一 target: ES2022，module: ESNext，paths 映射各包 src
- Lint/Format：ESLint + Prettier，提供 @xskynet/eslint-config 与 @xskynet/prettier-config 包
- 测试：Vitest + c8 覆盖率，最小样例 tests/hello.test.ts 覆盖 ≥80%（patch）
- 脚本：
  - pnpm -w build/typecheck/lint/test 贯通
  - 各包 scripts.build: tsc -p tsconfig.json，typecheck: tsc --noEmit

## 3. 质量流

- Husky pre-commit：lint-staged 仅检查变更文件（eslint --fix、prettier --write、vitest --changed）
- commitlint：约束 Conventional Commits（feat|fix|docs|chore|refactor|test|ci|build）
- Changesets：
  - 版本策略：packages/** 独立发布，遵循 semver；breaking → major，feat → minor，fix/docs/chore → patch
  - 触发：合并到 main 时根据 .changeset 计算版本与 CHANGELOG

## 4. CI（GitHub Actions）

- 触发：PR、push 到 main
- 运行矩阵：node@20.x / 22.x
- 步骤：
  1) setup-pnpm + pnpm cache
  2) install（frozen-lockfile）
  3) typecheck、lint、test 并行
  4) build 仅在上述通过后执行
  5) 上传覆盖率报告（artifact + 可选 Codecov 上传）
- 失败门禁：
  - typecheck/lint/test 任一失败则阻止合并
  - 可选：Codecov project≥80%、patch≥80%

## 5. DX

- DevContainer：.devcontainer/devcontainer.json（Node 22 + pnpm + git）
- Node 版本：.nvmrc/.node-version 对齐（22.x）
- 编辑器：.vscode/extensions.json 推荐 ESLint、Prettier、Vitest 扩展
- 本地脚手架：scripts/bootstrap.ts 校验 Node/pnpm，运行安装与健康检查

## 6. CLI 草案

- 命令：
  - xsk demo：运行 examples/demo 中的最小 agent，输出 "Hello Agent"
  - xsk init：在当前目录生成最小模板（package.json、tsconfig、示例 agent）
- 最小参数：
  - --output、--cwd；init 支持 --template minimal
- 交互流程：
  - 无参数时使用默认模板，提示确认写入

## 7. 快速上手脚本

确保以下命令全通过：

- pnpm i
- pnpm -w build
- pnpm -w test
- pnpm -w lint
- pnpm -w demo → 输出 "Hello Agent"

## 8. 验收标准与里程碑

- P1-04：脚本与基建完整，pre-commit 生效（husky、lint-staged、commitlint）
- P1-06：Quickstart.md 覆盖安装、运行 demo、常见问题
- P1-07：Vitest 覆盖率门槛配置，示例测试在本地与 CI 均通过
- P1-08：CI 三步并行/串行策略落地，覆盖率产物保留

## 9. PR 计划（文件清单与提交切分）

PR: docs/arch/monorepo-v0.1

提交切分建议：

1) docs: add arch spec v0.1
   - docs/arch/monorepo-v0.1.md

2) chore: workspace + ts target unification
   - tsconfig.base.json（ES2022、paths 完整）
   - pnpm-workspace.yaml（apps/* 纳入）

3) feat(dx): eslint/prettier configs and root scripts
   - packages/eslint-config/*、packages/prettier-config/*
   - .eslintrc.cjs、.prettierrc.json、.lintstagedrc.json
   - commitlint.config.cjs

4) feat(test): vitest baseline + example test
   - vitest.config.ts、tests/hello.test.ts、coverage 配置

5) chore(ci): gha workflow baseline
   - .github/workflows/ci.yml（matrix、cache、typecheck/lint/test/build）

6) feat(cli): demo wire-up and hello script
   - packages/cli/src/*、examples/demo/*，root scripts: demo

7) chore(docs): Quickstart.md
   - docs/Quickstart.md

8) chore(release): changesets init
   - .changeset/config.json + initial changeset

9) chore(docker): devcontainer + editor recommendations
   - .devcontainer/devcontainer.json、.vscode/extensions.json

回滚预案：
- 采用小步提交 + 逐步启用门禁（先警告后失败）
- 任一环节阻塞可通过 revert 单独提交回滚

---

如无异议，将按以上切分启动实现，并在每一步提供可运行的最小增量。
