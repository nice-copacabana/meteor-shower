# meteor-shower 用户指南

## 目录

1. [快速开始](#快速开始)
2. [安装和配置](#安装和配置)
3. [基础使用](#基础使用)
4. [高级功能](#高级功能)
5. [Web 界面使用](#web-界面使用)
6. [插件系统](#插件系统)
7. [故障排除](#故障排除)
8. [常见问题](#常见问题)

## 快速开始

### 系统要求

- Node.js 18.0 或更高版本
- npm 8.0 或更高版本
- 操作系统：Windows 10+、macOS 10.15+、Linux (Ubuntu 20.04+)

### 5 分钟快速体验

1. **克隆项目**
   ```bash
   git clone https://github.com/meteor-shower/meteor-shower.git
   cd meteor-shower
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **运行演示**
   ```bash
   ./scripts/demo.sh
   ```

5. **启动 Web 界面**
   ```bash
   ./scripts/start-all.sh
   ```

   然后访问 http://localhost:3001

## 安装和配置

### 完整安装

1. **环境准备**
   ```bash
   # 检查 Node.js 版本
   node --version  # 应该 >= 18.0
   
   # 检查 npm 版本
   npm --version   # 应该 >= 8.0
   ```

2. **项目下载**
   ```bash
   # 方式一：Git 克隆
   git clone https://github.com/meteor-shower/meteor-shower.git
   
   # 方式二：下载压缩包
   wget https://github.com/meteor-shower/meteor-shower/archive/main.zip
   unzip main.zip
   ```

3. **依赖安装**
   ```bash
   cd meteor-shower
   
   # 安装所有依赖
   npm run install:all
   ```

4. **项目构建**
   ```bash
   # 构建所有包
   npm run build
   
   # 验证构建结果
   find packages -name "dist" -type d
   ```

### Docker 安装

1. **使用 Docker Compose**
   ```bash
   # 启动所有服务
   docker-compose up -d
   
   # 查看服务状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

2. **单独构建镜像**
   ```bash
   # 构建镜像
   docker build -t meteor-shower:latest .
   
   # 运行容器
   docker run -d \
     --name meteor-shower \
     -p 3000:3000 \
     -p 3001:3001 \
     -p 3002:3002 \
     meteor-shower:latest
   ```

## 基础使用

### CLI 命令行工具

#### 初始化配置

```bash
# 交互式初始化
node packages/cli/dist/index.js init

# 指定参数初始化
node packages/cli/dist/index.js init \
  --tools gemini,claude \
  --template basic \
  --project-name my-project
```

**初始化流程：**

1. 选择要配置的 AI 工具
   - ✅ Gemini CLI
   - ✅ Claude Code  
   - ⬜ Cursor
   - ⬜ OpenAI/通用

2. 选择配置模板
   - 基础模板 (推荐)
   - 高级模板
   - 企业模板

3. 输入项目信息
   - 项目名称：`my-project`
   - AI 角色描述：`你是一名严谨的全栈工程师`

#### 查看配置差异

```bash
# 预览将要应用的变更
node packages/cli/dist/index.js diff

# 指定配置文件
node packages/cli/dist/index.js diff --config ./my-config.json
```

**输出示例：**
```
📋 配置差异预览
==================

将要创建的文件：
✅ ~/.gemini/GEMINI.md
✅ ~/.gemini/settings.json
✅ .gemini/commands/plan.toml

将要修改的文件：
🔄 ~/.claude/claude.json (2 处变更)

摘要：3 个新文件，1 个修改文件
```

#### 应用配置

```bash
# 应用配置变更
node packages/cli/dist/index.js apply

# 模拟运行（不实际写入文件）
node packages/cli/dist/index.js apply --dry-run

# 跳过备份
node packages/cli/dist/index.js apply --no-backup
```

#### 分享配置

```bash
# 分享当前配置到云端
node packages/cli/dist/index.js share

# 分享指定配置
node packages/cli/dist/index.js share --config my-config.json

# 添加描述和标签
node packages/cli/dist/index.js share \
  --description "我的开发配置" \
  --tags "development,typescript,react"
```

#### MCP 协议测试

```bash
# 测试 MCP 服务连接
node packages/cli/dist/index.js mcp test

# 测试指定端点
node packages/cli/dist/index.js mcp test --endpoint localhost:3002

# 详细输出
node packages/cli/dist/index.js mcp test --verbose
```

### 配置文件格式

#### 基础配置文件

创建 `meteor-shower.config.json`：

```json
{
  "version": "0.1.0",
  "project": {
    "name": "my-awesome-project",
    "description": "我的令人惊叹的项目"
  },
  "tools": {
    "gemini": {
      "enabled": true,
      "config": {
        "model": "gemini-pro",
        "temperature": 0.7,
        "maxTokens": 4096
      }
    },
    "claude": {
      "enabled": true,
      "config": {
        "model": "claude-3-sonnet",
        "maxTokens": 4096
      }
    }
  },
  "persona": "你是一名专业的全栈开发工程师，专注于 TypeScript 和 React 开发。",
  "codeStyle": {
    "indentSize": 2,
    "useTabs": false,
    "semiColons": true,
    "trailingCommas": "es5"
  }
}
```

#### 高级配置选项

```json
{
  "advanced": {
    "plugins": {
      "enabled": ["code-quality", "backup-manager", "performance-monitor"],
      "codeQuality": {
        "rules": ["typescript", "react", "node"],
        "severity": "warning"
      },
      "backupManager": {
        "retention": "7d",
        "compression": true
      },
      "performanceMonitor": {
        "enabled": true,
        "reportInterval": "1h"
      }
    },
    "security": {
      "dangerousCommands": ["rm -rf", "sudo", "dd"],
      "requireConfirmation": true,
      "encryptSecrets": true
    },
    "notifications": {
      "email": "user@example.com",
      "slack": "https://hooks.slack.com/...",
      "webhook": "https://api.example.com/webhooks/meteor-shower"
    }
  }
}
```

## 高级功能

### 模板系统

#### 创建自定义模板

1. **创建模板文件**

   `packages/templates/samples/my-template.json`：
   ```json
   {
     "id": "my-template",
     "name": "我的自定义模板",
     "version": "1.0.0",
     "targets": ["gemini", "claude"],
     "variables": {
       "projectName": "{{projectName}}",
       "persona": "{{persona}}",
       "framework": "{{framework}}",
       "language": "{{language}}"
     }
   }
   ```

2. **创建配置模板**

   `packages/templates/configs/my-template/`：
   ```
   ├── gemini.md.template
   ├── claude.json.template
   └── common.config.template
   ```

3. **模板变量说明**

   | 变量名 | 说明 | 示例 |
   |--------|------|------|
   | `{{projectName}}` | 项目名称 | `my-awesome-app` |
   | `{{persona}}` | AI 角色描述 | `你是一名专业的开发者` |
   | `{{framework}}` | 开发框架 | `React`, `Vue`, `Angular` |
   | `{{language}}` | 编程语言 | `TypeScript`, `JavaScript` |

#### 模板验证

```bash
# 验证模板格式
npm run validate-templates

# 测试模板渲染
node packages/cli/dist/index.js template test my-template
```

### 插件开发

#### 创建插件

1. **插件文件结构**
   ```
   packages/plugins/src/plugins/my-plugin.ts
   ```

2. **插件代码示例**
   ```typescript
   import { Plugin, PluginContext } from '../plugin-manager.js';
   
   const myPlugin: Plugin = {
     id: 'my-plugin',
     name: '我的插件',
     version: '1.0.0',
     description: '这是我的自定义插件',
     author: 'Your Name',
     enabled: true,
     dependencies: [],
     hooks: [
       {
         name: 'config:generate',
         handler: async (context: PluginContext) => {
           console.log('正在处理配置生成...');
           // 插件逻辑
           return context.data;
         }
       }
     ]
   };
   
   export default myPlugin;
   ```

3. **可用钩子**

   | 钩子名称 | 触发时机 | 参数 |
   |----------|----------|------|
   | `config:generate` | 配置生成时 | `{ tool, template, variables }` |
   | `config:apply` | 配置应用时 | `{ config, files }` |
   | `template:load` | 模板加载时 | `{ templateId, template }` |
   | `user:action` | 用户操作时 | `{ action, data }` |

#### 插件管理

```bash
# 加载插件
node -e "
import { PluginManager } from './packages/plugins/dist/plugin-manager.js';
const pm = new PluginManager();
await pm.loadPlugin('./packages/plugins/src/plugins/my-plugin.ts');
"

# 启用/禁用插件
node -e "
const pm = new PluginManager();
await pm.enablePlugin('my-plugin');
await pm.disablePlugin('my-plugin');
"
```

## Web 界面使用

### 访问 Web 控制台

启动服务后，可以通过以下地址访问不同的 Web 界面：

- **主控制台**: http://localhost:3001
- **监控仪表板**: http://localhost:3001/monitoring-dashboard
- **配置管理**: http://localhost:3001/config-manager

### 主控制台功能

#### 1. 工具配置

在主界面可以：

- ✅ 选择要配置的 AI 工具
- 📋 选择配置模板
- ✏️ 输入项目名称和 AI 角色描述
- 🔍 生成配置预览
- ⚡ 应用配置到系统

#### 2. 状态监控

实时显示：

- 📊 系统指标（CPU、内存、活跃会话）
- 🛠️ 服务状态（在线/离线/警告）
- 📋 最近活动日志
- 🔧 MCP 服务状态

### 监控仪表板

访问 `/monitoring-dashboard` 查看详细的系统监控信息：

#### 系统指标
- CPU 使用率
- 内存使用率
- 活跃会话数

#### 服务状态
- Cloud Hub API
- UI 控制台
- RAG 服务器
- MCP 协议服务
- 企业认证服务
- 监控收集器

#### 性能图表
- 响应时间趋势
- 错误率统计
- 实时性能监控

#### 告警管理
- 系统告警列表
- 告警级别和状态
- 告警历史记录

### 配置管理中心

访问 `/config-manager` 进行高级配置管理：

#### 配置操作
- 📋 查看所有配置
- ➕ 创建新配置
- ✏️ 编辑现有配置
- ⚡ 应用配置
- 🗑️ 删除配置

#### 配置状态
- 🟢 活跃：当前正在使用的配置
- 🟡 未激活：已创建但未应用的配置
- 🔵 待应用：等待应用的配置

#### 批量操作
- 📤 导出配置到文件
- 📥 从文件导入配置
- 🔄 批量刷新配置状态

### 语言切换

Web 界面支持多语言：

1. 点击右上角的语言选择器
2. 选择您偏好的语言：
   - 🇨🇳 简体中文
   - 🇺🇸 English
   - 🇯🇵 日本語
   - 🇰🇷 한국어

## 插件系统

### 内置插件

meteor-shower 提供了几个实用的内置插件：

#### 1. 代码质量检查器 (`code-quality`)

**功能：**
- 检查项目名称格式
- 验证 AI 角色描述完整性
- 检查配置完整性
- 提供代码质量建议

**使用：**
```bash
# 启用代码质量检查
node packages/plugins/dist/plugin-manager.js enable code-quality

# 查看检查结果
node packages/cli/dist/index.js apply  # 会自动运行质量检查
```

#### 2. 智能备份管理器 (`backup-manager`)

**功能：**
- 自动备份配置文件
- 版本控制和标记
- 智能回滚功能
- 定期清理旧备份

**配置：**
```json
{
  "plugins": {
    "backupManager": {
      "retention": "30d",
      "maxVersions": 10,
      "compression": true
    }
  }
}
```

#### 3. 性能监控器 (`performance-monitor`)

**功能：**
- 监控配置生成耗时
- 记录配置应用性能
- 生成性能报告
- 提供优化建议

**报告示例：**
```
📊 性能报告
============
配置生成: 125ms
配置应用: 340ms
总耗时: 465ms
性能评级: A
```

### 插件配置

#### 全局插件配置

在 `meteor-shower.config.json` 中配置插件：

```json
{
  "plugins": {
    "enabled": ["code-quality", "backup-manager"],
    "disabled": ["performance-monitor"],
    "settings": {
      "codeQuality": {
        "strictMode": true,
        "rules": ["naming", "completeness", "security"]
      },
      "backupManager": {
        "autoBackup": true,
        "retention": "7d"
      }
    }
  }
}
```

#### 插件优先级

插件按照以下优先级执行：

1. **系统插件** (最高优先级)
2. **内置插件**
3. **用户插件**
4. **第三方插件** (最低优先级)

## 故障排除

### 常见问题解决

#### 1. 安装问题

**问题：`npm install` 失败**

解决方案：
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

**问题：构建失败**

解决方案：
```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18.0

# 检查 TypeScript 版本
npx tsc --version

# 清理并重新构建
npm run clean
npm run build
```

#### 2. 运行时问题

**问题：端口占用**

解决方案：
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001
lsof -i :3002

# 终止占用进程
kill -9 <PID>

# 或使用不同端口
PORT=3010 npm start
```

**问题：权限错误**

解决方案：
```bash
# 修复脚本权限
chmod +x scripts/*.sh

# 修复文件权限
sudo chown -R $USER:$USER .
```

#### 3. 配置问题

**问题：配置文件不生效**

检查列表：
- ✅ 配置文件格式是否正确（JSON 语法）
- ✅ 文件路径是否正确
- ✅ 权限是否足够
- ✅ 目标目录是否存在

**问题：模板渲染失败**

解决方案：
```bash
# 验证模板格式
npm run validate-templates

# 检查变量定义
node packages/cli/dist/index.js template validate <template-id>

# 手动测试渲染
node packages/cli/dist/index.js template render <template-id> --variables '{"projectName":"test"}'
```

### 调试模式

#### 启用详细日志

```bash
# 设置调试级别
DEBUG=* npm run dev

# 只显示特定模块日志
DEBUG=meteor-shower:* npm run dev

# 显示错误堆栈
NODE_ENV=development npm run dev
```

#### 使用调试工具

```bash
# Node.js 调试器
node --inspect packages/cli/dist/index.js init

# Chrome DevTools
# 在 Chrome 中访问 chrome://inspect
```

### 性能诊断

#### 性能分析

```bash
# 运行性能测试
npm run benchmark

# 生成性能报告
node scripts/benchmark.ts --report

# 运行负载测试
node scripts/load-test.js
```

#### 内存分析

```bash
# 启用内存监控
node --max-old-space-size=4096 \
     --expose-gc \
     packages/cli/dist/index.js apply

# 生成内存快照
node --inspect --heapdump packages/cli/dist/index.js
```

## 常见问题

### Q: 如何备份现有配置？

A: meteor-shower 会在应用新配置前自动创建备份。您也可以手动备份：

```bash
# 手动创建备份
cp ~/.gemini/GEMINI.md ~/.gemini/GEMINI.md.backup

# 使用内置备份功能
node packages/cli/dist/index.js backup create

# 列出所有备份
node packages/cli/dist/index.js backup list
```

### Q: 如何自定义 AI 工具配置？

A: 可以通过以下方式自定义：

1. **修改模板变量**
   ```json
   {
     "variables": {
       "model": "gemini-pro-vision",
       "temperature": 0.9,
       "maxTokens": 8192
     }
   }
   ```

2. **创建自定义模板**
   ```bash
   # 复制现有模板
   cp packages/templates/samples/gemini-basic.json \
      packages/templates/samples/my-gemini.json
   
   # 编辑自定义模板
   vim packages/templates/samples/my-gemini.json
   ```

### Q: 如何集成到 CI/CD 流水线？

A: 可以在 CI/CD 中使用 meteor-shower：

```yaml
# GitHub Actions 示例
name: Setup AI Tools
on: [push]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install meteor-shower
        run: |
          npm install
          npm run build
          
      - name: Apply AI tool configs
        run: |
          node packages/cli/dist/index.js apply \
            --config .meteor-shower/ci-config.json \
            --no-interactive
```

### Q: 如何处理配置冲突？

A: 当检测到配置冲突时：

1. **查看冲突详情**
   ```bash
   node packages/cli/dist/index.js diff --detailed
   ```

2. **选择解决策略**
   ```bash
   # 强制覆盖
   node packages/cli/dist/index.js apply --force
   
   # 合并配置
   node packages/cli/dist/index.js apply --merge
   
   # 交互式解决
   node packages/cli/dist/index.js apply --interactive
   ```

### Q: 如何监控系统性能？

A: meteor-shower 提供了多种监控方式：

1. **Web 监控仪表板**
   - 访问 http://localhost:3001/monitoring-dashboard

2. **命令行监控**
   ```bash
   # 实时监控
   node packages/cli/dist/index.js monitor

   # 性能报告
   node packages/cli/dist/index.js report performance
   ```

3. **API 监控**
   ```bash
   # 系统指标
   curl http://localhost:3001/api/metrics
   
   # 服务状态
   curl http://localhost:3001/api/services
   ```

### Q: 如何贡献代码？

A: 欢迎贡献代码！请按照以下步骤：

1. **Fork 项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **提交代码**
   ```bash
   git commit -m "feat: add my awesome feature"
   ```

4. **运行测试**
   ```bash
   npm test
   npm run test:coverage
   ```

5. **提交 Pull Request**

---

更多信息请访问：
- 📖 [API 文档](./API.md)
- 🚀 [部署指南](../DEPLOYMENT_GUIDE.md)
- 🏗️ [架构设计](./ARCHITECTURE.md)
- 💡 [插件开发指南](./PLUGIN_DEVELOPMENT.md)