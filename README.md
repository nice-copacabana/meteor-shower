# meteor-shower

AI 编程工具一键优化与同步平台

## �� 功能特性

- **一键配置**：支持 Gemini CLI、Claude Code、Cursor、OpenAI 等多工具配置
- **模板化**：JSONSchema 驱动的模板系统，支持变量替换与验证
- **云端共享**：Cloud Hub 支持模板上传、检索、评分与分享
- **安全可靠**：自动备份、回滚机制、危险命令检测
- **RAG 集成**：内置 RAG 服务器示例，支持向量搜索与 MCP 协议

## 📦 项目结构

```
meteor-shower/
├── packages/
│   ├── cli/              # CLI 命令行工具
│   ├── adapters/         # 多工具适配层
│   ├── utils/            # 核心工具类
│   └── cloud-hub/        # 云端服务
├── packages/templates/   # 模板与示例
├── examples/             # 示例项目
└── scripts/              # 自动化脚本
```

## 🛠️ 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行演示

```bash
# 演示 CLI 功能
./scripts/demo.sh

# 启动全栈服务
./scripts/start-all.sh
```

### 使用 CLI

```bash
# 初始化配置
node packages/cli/dist/index.js init

# 查看差异
node packages/cli/dist/index.js diff

# 应用配置
node packages/cli/dist/index.js apply

# 测试 MCP 服务
node packages/cli/dist/index.js mcp test
```

## 🏗️ 开发

### 本地开发

```bash
# 开发模式运行 CLI
npm run dev --workspace=packages/cli

# 开发模式运行 Cloud Hub
npm run dev --workspace=packages/cloud-hub
```

### 测试

```bash
npm test
```

## 📋 开发计划

- ✅ **M1**: CLI 基础功能、适配层、模板引擎
- ✅ **M2**: Cloud Hub、RAG 示例、启动脚本
- 🔄 **M3**: UI 控制台、企业特性、可观测性

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
