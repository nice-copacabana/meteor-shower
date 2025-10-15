# meteor-shower CLI 使用指南

**版本**: 0.1.0  
**更新日期**: 2025-10-14  
**生成工具**: Qoder AI (Model: claude-sonnet-4-20250514)

---

## 目录

1. [快速开始](#快速开始)
2. [命令概览](#命令概览)
3. [详细命令说明](#详细命令说明)
4. [使用场景示例](#使用场景示例)
5. [最佳实践](#最佳实践)
6. [故障排查](#故障排查)

---

## 快速开始

### 安装

```bash
npm install -g meteor-shower
# 或
yarn global add meteor-shower
```

### 5分钟快速入门

```bash
# 1. 初始化配置
ms init

# 2. 查看配置差异
ms diff

# 3. 应用配置
ms apply

# 4. 分享配置到云端（可选）
ms share
```

---

## 命令概览

| 命令 | 说明 | 示例 |
|------|------|------|
| `ms init` | 初始化配置向导 | `ms init` |
| `ms diff` | 查看配置差异 | `ms diff` |
| `ms apply` | 应用配置变更 | `ms apply` |
| `ms share` | 分享配置到云端 | `ms share` |
| `ms mcp` | MCP服务探测 | `ms mcp` |
| `ms version` | 查看版本信息 | `ms version` |
| `ms help` | 查看帮助信息 | `ms help` |

---

## 详细命令说明

### 1. `ms init` - 初始化配置

启动交互式配置向导，引导您完成AI工具的配置。

#### 基本用法

```bash
ms init
```

#### 配置流程

**步骤1: 选择工具集**
```
? 选择要配置的 AI 工具 (使用空格选择, Enter确认):
 ◉ Gemini CLI - Google 最新AI模型
 ◉ Claude - Anthropic 旗舰模型
 ◯ Cursor - AI编程IDE
 ◯ OpenAI - GPT系列模型
```

**步骤2: 选择模板**
```
? 选择配置模板:
❯ 多工具基础模板 (推荐)
  多工具高级模板
  团队协作模板
  自定义配置
```

**步骤3: 配置项目变量**
```
? 项目名称: my-awesome-project
? 项目描述: 我的AI辅助开发项目
? AI 角色描述: 你是一名严谨的全栈工程师
```

**步骤4: 配置工具特定参数**

**Gemini配置:**
```
? Gemini 模型选择: gemini-2.0-flash-exp
? Temperature (0.0-2.0, 推荐0.2): 0.2
? 最大输出 tokens (1-8192): 8192
? 启用多模态支持 (图片/视频)? No
? 启用代码生成优化? Yes
```

**Claude配置:**
```
? Claude 模型选择: claude-3-5-sonnet-20241022
? 启用 Claude 视觉功能? No
? 最大输出 tokens (1-4096): 4000
```

**Cursor配置:**
```
? Cursor AI 模型: gpt-4
? 启用 Cursor Composer (多文件编辑)? Yes
? 启用 Tab 补全建议? Yes
```

**OpenAI配置:**
```
? OpenAI 模型选择: gpt-4-turbo
? 最大输出 tokens (1-128000): 4096
? Temperature (0.0-2.0): 0.7
? 启用流式响应? Yes
```

**通用代码风格配置:**
```
? 代码缩进风格: 2个空格 (推荐)
? 启用 Prettier 格式化? Yes
? 启用 ESLint 检查? Yes
? 要求编写单元测试? Yes
```

#### 输出结果

配置计划将保存到 `.meteor-shower/config-plan.json`：

```json
{
  "template": "multi-basic",
  "toolset": ["gemini", "claude"],
  "variables": {
    "projectName": "my-awesome-project",
    "persona": "你是一名严谨的全栈工程师",
    // ... 更多变量
  },
  "operations": [
    {
      "tool": "gemini",
      "files": ["~/.gemini/GEMINI.md", "~/.gemini/settings.json"]
    }
  ]
}
```

#### 高级选项

使用预定义模板：
```bash
# 使用全栈应用模板
ms init --template full-stack-app

# 使用AI助手模板
ms init --template ai-assistant

# 使用数据科学模板
ms init --template data-science
```

---

### 2. `ms diff` - 查看配置差异

分析并展示即将进行的配置变更。

#### 基本用法

```bash
ms diff
```

#### 输出示例

```
🔍 分析配置差异

────────────────────────────────────────────────────────────

配置计划信息:
  模板:     multi-basic
  工具集:   gemini, claude
  变量数:   15

正在分析配置差异...

📊 变更统计:

┌───────────────┬──────────┬─────────────────────────────────┐
│ 类型          │ 数量     │ 说明                            │
├───────────────┼──────────┼─────────────────────────────────┤
│ ✨ 新建       │ 5        │ 将创建新配置文件                │
│ 🔄 更新       │ 1        │ 将更新现有配置文件              │
│ 总计          │ 6        │ 配置文件总数                    │
└───────────────┴──────────┴─────────────────────────────────┘

📋 详细变更列表:

┌────────┬────────────┬──────────────────────────────────┐
│ 操作   │ 工具       │ 文件路径                         │
├────────┼────────────┼──────────────────────────────────┤
│ ✨     │ GEMINI     │ ~/.gemini/GEMINI.md              │
│ ✨     │            │ ~/.gemini/settings.json          │
│ ✨     │            │ ./.gemini/commands/plan.toml     │
│ ✨     │ CLAUDE     │ ~/.claude/claude.json            │
│ 🔄     │            │ ./CLAUDE.md                      │
│ ✨     │            │ ./CLAUDE.local.md                │
└────────┴────────────┴──────────────────────────────────┘

🎯 下一步操作:

  1. 检查上述变更是否符合预期
  2. 运行 ms apply 应用这些变更
  3. 运行 ms apply --dry-run 模拟应用过程

────────────────────────────────────────────────────────────
```

#### 注意事项

- 运行 `ms diff` 前必须先运行 `ms init`
- 差异分析基于配置计划文件
- 不会实际修改任何文件

---

### 3. `ms apply` - 应用配置

执行配置变更，将配置文件写入到指定位置。

#### 基本用法

```bash
ms apply
```

#### 试运行模式

```bash
# 模拟应用过程，不实际写入文件
ms apply --dry-run
```

#### 执行流程

1. **读取配置计划**
   ```
   📄 加载配置计划: .meteor-shower/config-plan.json
   ```

2. **逐工具应用配置**
   ```
   ⚡ 应用 Gemini 配置...
     ✅ 写入 Gemini 主配置文件: ~/.gemini/GEMINI.md
     ✅ 写入 Gemini 设置文件: ~/.gemini/settings.json
     ✅ 写入 Gemini 命令规划文件: ./.gemini/commands/plan.toml
   
   ⚡ 应用 Claude 配置...
     ✅ 写入 Claude 配置文件: ~/.claude/claude.json
     ✅ 写入 Claude 指令文档: ./CLAUDE.md
     ✅ 写入 Claude 本地配置: ./CLAUDE.local.md
   ```

3. **完成提示**
   ```
   ✅ 配置应用成功！
   
   📊 应用摘要:
     工具数量: 2
     创建文件: 5 个
     更新文件: 1 个
   
   🎯 下一步:
     • 检查生成的配置文件
     • 设置必要的API密钥
     • 重启相关工具使配置生效
   ```

#### 备份机制

- 应用配置前自动备份现有文件
- 备份文件格式: `{原文件名}.backup`
- 支持回滚操作

#### 错误处理

如果应用过程中出现错误：

```bash
❌ 应用配置失败

错误详情:
  工具: gemini
  文件: ~/.gemini/GEMINI.md
  原因: Permission denied

建议:
  • 检查文件权限
  • 使用 sudo 运行（谨慎）
  • 手动创建目录后重试
```

---

### 4. `ms share` - 分享配置

将配置上传到云端，便于团队共享和跨设备同步。

#### 基本用法

```bash
ms share
```

#### 执行流程

```
☁️  上传配置到云端...

📤 正在上传配置文件...
  ✅ 配置计划已上传
  ✅ 模板文件已上传

🔗 分享链接: https://meteor-shower.io/config/abc123

📋 分享信息:
  配置ID: abc123
  有效期: 30天
  访问方式: 公开/私密

💡 使用方法:
  其他用户可以通过以下命令下载配置:
  ms download abc123
```

#### 选项

```bash
# 私密分享（需要密码）
ms share --private

# 设置过期时间
ms share --expires 7d

# 添加描述
ms share --description "团队标准配置"
```

---

### 5. `ms mcp` - MCP服务探测

探测和管理Model Context Protocol (MCP) 服务。

#### 基本用法

```bash
ms mcp
```

#### 功能

- 自动发现本地MCP服务
- 显示服务状态和能力
- 测试服务连接

#### 输出示例

```
🔍 探测 MCP 服务...

发现 2 个 MCP 服务:

┌────────────────┬──────────┬─────────────────────────┐
│ 服务名称       │ 状态     │ 端口                    │
├────────────────┼──────────┼─────────────────────────┤
│ filesystem     │ ✅ 运行  │ 3000                    │
│ database       │ ✅ 运行  │ 3001                    │
└────────────────┴──────────┴─────────────────────────┘

💡 提示: 使用 ms mcp --config 配置MCP服务
```

---

## 使用场景示例

### 场景1: 新项目初始化

**目标**: 为新的全栈项目配置AI工具

```bash
# 1. 初始化项目
mkdir my-fullstack-app
cd my-fullstack-app
git init

# 2. 使用全栈模板初始化AI配置
ms init --template full-stack-app

# 选择工具: Gemini + Cursor
# 配置技术栈: React + Node.js + TypeScript

# 3. 查看将要创建的配置
ms diff

# 4. 应用配置
ms apply

# 5. 提交配置到Git
git add .meteor-shower/
git commit -m "chore: 添加AI工具配置"
```

### 场景2: 团队配置共享

**目标**: 将配置分享给团队成员

```bash
# 团队负责人操作:
# 1. 创建标准配置
ms init --template team-collaboration

# 2. 分享到云端
ms share --description "团队标准AI配置" --private

# 输出: 配置ID abc123

# 团队成员操作:
# 1. 下载配置
ms download abc123

# 2. 应用配置
ms apply
```

### 场景3: 多环境配置

**目标**: 为开发和生产环境配置不同的AI工具

```bash
# 开发环境 (本地)
ms init
# 选择: Gemini + Cursor (免费/低成本)
ms apply

# 生产环境配置
ms init --template production
# 选择: Claude + OpenAI (高质量)
ms apply --profile production
```

### 场景4: 配置迁移

**目标**: 从一台机器迁移配置到另一台机器

```bash
# 旧机器
cd ~/projects/my-app
ms share --description "我的配置备份"
# 记录配置ID: xyz789

# 新机器
ms download xyz789
ms apply
```

---

## 最佳实践

### 1. 版本控制

**推荐做法**:
- ✅ 将 `.meteor-shower/config-plan.json` 提交到Git
- ✅ 在 `.gitignore` 中排除敏感的API密钥文件
- ✅ 使用分支管理不同的配置版本

**示例 .gitignore**:
```gitignore
# 排除包含API密钥的文件
.env
*.key
.secrets/

# 保留配置计划
!.meteor-shower/config-plan.json
```

### 2. 项目结构

**推荐的项目结构**:
```
my-project/
├── .meteor-shower/
│   ├── config-plan.json      # 配置计划 (提交到Git)
│   └── backups/               # 备份文件 (不提交)
├── .gemini/
│   └── commands/
│       └── plan.toml          # 项目级配置 (提交到Git)
├── CLAUDE.md                  # Claude配置 (提交到Git)
├── CLAUDE.local.md            # 本地配置 (不提交)
└── .cursorrules               # Cursor规则 (提交到Git)
```

### 3. API密钥管理

**安全实践**:
- 🔒 使用环境变量存储API密钥
- 🔒 不要将密钥硬编码在配置文件中
- 🔒 使用 `.env` 文件管理密钥（不提交到Git）

**示例 .env**:
```bash
GEMINI_API_KEY=your_gemini_key_here
CLAUDE_API_KEY=your_claude_key_here
OPENAI_API_KEY=your_openai_key_here
```

**在配置中使用**:
```json
{
  "apiKey": "{{GEMINI_API_KEY}}"
}
```

### 4. 团队协作

**建议流程**:

1. **创建标准配置**
   ```bash
   ms init --template team-collaboration
   ```

2. **文档化配置决策**
   - 在README中说明为什么选择这些工具
   - 记录配置参数的含义
   - 提供故障排查指南

3. **定期同步**
   ```bash
   # 每周或每次大更新时
   ms share --description "团队配置 v2.0"
   ```

4. **新成员入职**
   ```bash
   # 提供配置ID给新成员
   ms download team-config-id
   ms apply
   ```

### 5. 配置优化

**性能优化**:
- 🚀 合理设置 `temperature` 平衡创造性和准确性
- 🚀 根据任务类型调整 `maxTokens`
- 🚀 启用缓存减少API调用

**成本优化**:
- 💰 开发环境使用免费/低成本模型
- 💰 生产环境使用高质量付费模型
- 💰 监控token使用量

---

## 故障排查

### 问题1: 未找到配置计划文件

**错误信息**:
```
❌ 错误: 未找到配置计划文件
```

**解决方案**:
```bash
# 先运行 init 创建配置
ms init
```

### 问题2: 权限错误

**错误信息**:
```
❌ 应用配置失败
原因: Permission denied
```

**解决方案**:
```bash
# 检查目标目录权限
ls -la ~/.gemini

# 如果目录不存在，创建它
mkdir -p ~/.gemini ~/.claude

# 修改权限
chmod 755 ~/.gemini ~/.claude
```

### 问题3: API密钥未设置

**错误信息**:
```
⚠️  警告: 检测到未设置的API密钥
```

**解决方案**:
```bash
# 创建 .env 文件
cat > .env << EOF
GEMINI_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here
EOF

# 或设置环境变量
export GEMINI_API_KEY=your_key_here
export CLAUDE_API_KEY=your_key_here
```

### 问题4: 配置冲突

**错误信息**:
```
❌ 配置文件已存在且内容不同
```

**解决方案**:
```bash
# 查看差异
ms diff

# 备份现有配置
cp ~/.gemini/GEMINI.md ~/.gemini/GEMINI.md.old

# 强制覆盖
ms apply --force
```

### 问题5: 网络问题

**错误信息**:
```
❌ 上传失败: Network error
```

**解决方案**:
```bash
# 检查网络连接
ping meteor-shower.io

# 使用代理
export HTTP_PROXY=http://proxy.example.com:8080
ms share

# 离线模式（不上传）
ms apply --offline
```

---

## 附录

### A. 支持的AI工具

| 工具 | 支持状态 | 说明 |
|------|----------|------|
| Gemini | ✅ 完全支持 | Google最新AI模型 |
| Claude | ✅ 完全支持 | Anthropic旗舰模型 |
| Cursor | ✅ 完全支持 | AI编程IDE |
| OpenAI | ✅ 完全支持 | GPT系列模型 |

### B. 配置文件位置

| 工具 | 全局配置 | 项目配置 |
|------|----------|----------|
| Gemini | `~/.gemini/` | `.gemini/` |
| Claude | `~/.claude/` | `./CLAUDE.md` |
| Cursor | `~/.cursor/` | `.cursorrules` |
| OpenAI | `~/.openai/` | `.openai/` |

### C. 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `METEOR_SHOWER_CONFIG` | 配置目录 | `.meteor-shower` |
| `METEOR_SHOWER_API` | API端点 | `https://api.meteor-shower.io` |
| `METEOR_SHOWER_OFFLINE` | 离线模式 | `false` |

### D. 相关链接

- **官方网站**: https://meteor-shower.io
- **GitHub仓库**: https://github.com/meteor-shower/meteor-shower
- **问题反馈**: https://github.com/meteor-shower/meteor-shower/issues
- **文档中心**: https://docs.meteor-shower.io

---

**文档版本**: v0.1.0  
**最后更新**: 2025-10-14  
**维护者**: meteor-shower团队
