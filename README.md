# meteor-shower

AI 编程工具一键优化与同步平台

## 🚀 功能特性

- **一键配置**：支持 Gemini CLI、Claude Code、Cursor、OpenAI 等多工具配置
- **模板化**：JSONSchema 驱动的模板系统，支持变量替换与验证
- **云端共享**：Cloud Hub 支持模板上传、检索、评分与分享
- **用户分层体系**：免费版/专业版/团队版/企业版，满足不同规模用户需求（规划中）
- **数据治理**：私有/团队/企业/公开多级数据可见性控制（规划中）
- **能力验证案例库**：专家贡献的精巧测试案例，用于验证大模型能力和配置效果（开发中）
- **任务协调管理**：统一管理跨工具的AI任务执行，提供智能调度和进度追踪（规划中）
- **安全可靠**：自动备份、回滚机制、危险命令检测
- **RAG 集成**：内置 RAG 服务器示例，支持向量搜索与 MCP 协议

## 📦 项目结构

```
meteor-shower/
├── packages/
│   ├── cli/              # CLI 命令行工具 - 主要的用户交互接口
│   ├── adapters/         # 多工具适配层 - 统一的工具配置接口
│   ├── utils/            # 核心工具类 - 模板引擎、文件操作等
│   ├── cloud-hub/        # 云端服务 - 模板共享与存储服务
│   ├── user-tier/        # 用户分层 - 免费/专业/团队/企业版管理（规划中）
│   ├── capability-validation/ # 能力验证案例库 - 专家贡献的测试案例（规划中）
│   ├── task-coordination/ # 任务协调管理 - AI任务调度与监控（规划中）
│   ├── ui/               # Web 控制台 - 可视化管理界面
│   ├── enterprise/       # 企业功能 - 企业级特性与数据治理
│   ├── observability/    # 可观察性 - 监控和日志
│   ├── plugins/          # 插件系统 - 可扩展插件
│   └── updater/          # 更新器 - 自动更新功能
├── packages/templates/   # 模板与示例 - 配置模板和示例
├── examples/             # 示例项目 - 使用示例和演示
├── scripts/              # 自动化脚本 - 部署和运维脚本
└── docs/                 # 文档 - 项目文档和指南
```

## 🛠️ 快速开始

### 📦 安装依赖

```bash
npm install
```

### 🔨 构建项目

```bash
npm run build
```

### 🚀 运行演示

```bash
# 演示 CLI 功能
./scripts/demo.sh

# 启动全栈服务
./scripts/start-all.sh
```

### 💻 使用 CLI

```bash
# 初始化配置 - 交互式选择工具和模板
node packages/cli/dist/index.js init

# 查看差异 - 对比模板渲染结果与当前环境
node packages/cli/dist/index.js diff

# 应用配置 - 执行配置修改（支持回滚）
node packages/cli/dist/index.js apply

# 测试 MCP 服务 - 验证MCP协议服务可用性
node packages/cli/dist/index.js mcp test
```

## 🏗️ 开发

### 🔧 本地开发

```bash
# 开发模式运行 CLI - 使用ts-node直接运行TypeScript
npm run dev --workspace=packages/cli

# 开发模式运行 Cloud Hub - 实时重载开发
npm run dev --workspace=packages/cloud-hub

# 开发模式运行 UI 控制台
npm run dev --workspace=packages/ui
```

### 🧪 测试

```bash
# 运行根目录测试
npm test

# 运行 CLI 包测试
npm run test:cli

# 运行所有包测试
npm run test:all
```

## 📋 开发计划

- ✅ **M1**: CLI 基础功能、适配层、模板引擎 - 核心架构搭建完成
- ✅ **M2**: Cloud Hub、RAG 示例、启动脚本 - 云端服务和演示功能
- ✅ **M3**: UI 控制台、企业特性、可观测性 - 已完成
- ✅ **M4**: 插件系统、监控告警、性能优化 - 已完成
- ✅ **M5**: 多语言支持、国际化、文档完善 - 已完成
- 📅 **M6**: 用户分层体系、定价方案、数据治理模型 - 规划中
- 📅 **M7**: 能力验证案例库、专家测试案例平台 - 规划中
- 📅 **M8**: 任务协调管理系统、智能调度平台 - 规划中

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
