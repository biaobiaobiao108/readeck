# Readeck (全栈 Bun 版)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-v1.4+-black?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org)

> **Readeck** 是一个简洁高效、注重隐私的开源网页书签管理器与“稍后阅读”（Read-it-later）服务。  
> 本项目为基于 **全栈 Bun (TypeScript)** 现代单体多包（Monorepo）架构重构版本：前端采用 React 19 + Tailwind CSS 并由原生 `bun build` 极速打包，后端采用 `Bun.serve` + `Hono` + 原生 `bun:sqlite`，测试全面采用 `bun test`。

---

## ✨ 核心特性

- ⚡ **全栈极致性能**：全面采用 Bun 运行时与原生构建工具链，前端毫秒级极速打包，后端轻量高并发。
- 📖 **智能正文提取**：集成 `@mozilla/readability` 与轻量 DOM 解析引擎，精准提取任意网页的标题、正文 HTML、摘要、预估阅读时间及封面图。
- 👓 **沉浸式阅读器（Reader View）**：
  - 专为长文阅读优化的高品质排版；
  - 支持字体大小快捷缩放调节；
  - 浅色、羊皮纸（Sepia）、深色护眼模式无缝切换。
- 🏷️ **灵活的书签分类**：支持未读（Unread）、归档（Archive）、星标收藏（Favorites）及自定义标签体系，内置实时全文检索。
- 🧩 **浏览器扩展完全兼容**：
  - 100% 兼容官方 Readeck 浏览器扩展（Chrome / Firefox / Safari）；
  - 支持实例环境探测（`GET /api/info`）与 Token 鉴权（`GET /api/profile`）；
  - 支持浏览器端 DOM 直接传输入库（即使面对需要登录或反爬的内网/付费网页，也能一键转存正文）。
- 🚀 **单进程一体化交付**：生产环境下由单一 Bun 后端进程统一托管 RESTful API、SPA 前端单页应用及静态资源，开箱即用。

---

## 🏗️ 项目架构

本项目采用 **Bun Workspaces** 单体多包架构管理：

```
readeck/
├── apps/
│   ├── server/           # 后端服务 (Bun.serve + Hono + bun:sqlite)
│   │   ├── src/
│   │   │   ├── db/       # 原生 SQLite 数据库驱动与表结构
│   │   │   ├── extractor/# Readability 网页正文提取引擎
│   │   │   ├── routes/   # REST API 路由 (Auth, Bookmarks, Tags, Info)
│   │   │   └── index.ts  # 服务端入口 & SPA 静态资源统一托管
│   │   └── test/         # 自动化测试套件 (bun test)
│   └── web/              # 前端单页应用 (React 19 + Tailwind CSS)
│       ├── src/          # 阅读器界面、卡片流、侧边栏及弹窗组件
│       └── build.ts      # 原生 bun build 打包脚本
├── packages/
│   └── shared/           # 前后端共享 TypeScript 类型定义与 API 契约
├── package.json          # 根目录工作区与统一构建脚本
└── tsconfig.json         # 全局 TypeScript 配置
```

---

## 🚀 快速上手

### 环境要求

- [Bun](https://bun.sh) >= 1.2（推荐 Bun 1.4+）

### 1. 安装依赖

```bash
bun install
```

### 2. 运行自动化测试

```bash
bun test
```

### 3. 生产环境构建与启动

```bash
# 构建前端生产静态文件
bun run build

# 启动服务（默认监听端口 8000）
bun start
```

启动后在浏览器打开 `http://localhost:8000` 即可使用。

### 4. 本地开发调试

```bash
# 同时启动后端服务热重载与前端热更新
bun run dev
```

---

## 🔌 搭配浏览器扩展使用

1. 启动服务后，在网页端注册/登录你的账户并获取 API Token。
2. 在 Chrome / Firefox 扩展商店安装官方 **Readeck** 插件。
3. 进入扩展选项页面设置：
   - **Server URL**: `http://localhost:8000`（或你部署的域名）
   - **API Token**: 填入你的 Token
4. 点击 **Save / Test Connection** 提示成功后，即可在任意浏览页面一键收藏文章至 Readeck！

---

## 🛠️ 常用开发命令

| 命令 | 说明 |
| :--- | :--- |
| `bun install` | 安装所有工作区依赖并自动建立软链 |
| `bun test` | 执行所有单元测试与 API 集成测试 |
| `bun run check` | 执行全工程 TypeScript 类型检查（`tsc --noEmit`） |
| `bun run build` | 编译前端 SPA 与样式至 `apps/web/dist` |
| `bun start` | 运行生产全栈单进程服务 |
| `bun run dev` | 运行开发热重载模式 |

---

## 📄 开源协议

本项目基于 [AGPL-3.0](LICENSE) 协议开源。
