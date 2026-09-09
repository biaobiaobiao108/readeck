# AGENTS.md

## 核心开发准则

- **信息足够后立即行动**：不做无意义的调查，专注交付。
- **不确定时明确说明**：不推测编造，确保技术判断严谨可靠。
- **直面问题**：若发现需求或方案存在明显逻辑/架构冲突，直接指出并提供最优解。

## Git 提交规范（重要）

- **原子化提交**：本项目**每次实现一个新功能或者修复一个问题，都必须立即执行一次 `git commit`**。
- **提交信息规范**：采用约定式提交规范（Conventional Commits），清晰描述改动范围与内容，例如：
  - `feat(server): add support for browser extension DOM extraction`
  - `fix(web): correct font sizing in reader view`
  - `test(api): add tests for GET /api/bookmarks/labels`
  - `refactor(db): optimize query index for tags`

## 技术栈与工程规范

- **全栈 Bun 体系**：
  - 包管理：统一使用 `bun install` / `bun add`。
  - 后端服务：基于 `Bun.serve` + `Hono` + 原生 `bun:sqlite`。
  - 前端应用：基于 React 19 + Tailwind CSS，使用原生 `bun build` 极速打包构建。
  - 自动化测试：全面采用 `bun test`。
  - 类型检查：使用 `tsc --noEmit`。
- **项目结构（Bun Workspaces Monorepo）**：
  - `packages/shared`：前后端共用的 TypeScript 类型定义与 API 契约。
  - `apps/server`：后端 API 服务及生产静态资源托管。
  - `apps/web`：前端阅读器 SPA 单页应用。
- **精简依赖**：优先利用 Bun 内建的高性能能力与已引入库，杜绝冗余外部依赖。
