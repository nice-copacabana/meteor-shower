# meteor-shower 适配器开发指南

**版本**: 0.1.0  
**更新日期**: 2025-10-14  
**生成工具**: Qoder AI (Model: claude-sonnet-4-20250514)

---

## 目录

1. [适配器概述](#适配器概述)
2. [快速开始](#快速开始)
3. [适配器接口](#适配器接口)
4. [实现指南](#实现指南)
5. [最佳实践](#最佳实践)
6. [测试](#测试)
7. [示例](#示例)

---

## 适配器概述

### 什么是适配器？

适配器（Adapter）是meteor-shower中用于统一不同AI工具配置接口的组件。每个AI工具（Gemini、Claude、Cursor、OpenAI等）都有自己独特的配置方式，适配器负责将统一的配置格式转换为特定工具的配置文件。

### 适配器职责

1. **配置规划（Plan）**: 分析将要进行的配置变更
2. **配置应用（Apply）**: 实际写入配置文件
3. **配置回滚（Rollback）**: 恢复到变更前的状态

### 现有适配器

| 适配器 | 工具 | 配置文件 | 状态 |
|--------|------|----------|------|
| GeminiAdapter | Gemini CLI | `~/.gemini/GEMINI.md` | ✅ 已实现 |
| ClaudeAdapter | Claude | `~/.claude/claude.json` | ✅ 已实现 |
| CursorAdapter | Cursor | `.cursorrules` | ✅ 已实现 |
| OpenAIAdapter | OpenAI | `~/.openai/config.json` | ✅ 已实现 |

---

## 快速开始

### 创建新适配器

以创建一个 Copilot 适配器为例：

```typescript
// packages/adapters/src/copilot.ts
import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class CopilotAdapter implements Adapter {
  private backupPaths: Map<string, string> = new Map();

  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 Copilot 配置变更...'));
    
    return {
      changes: [
        { path: '~/.copilot/config.json', kind: 'create' }
      ],
      summary: '将创建 Copilot 配置文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 Copilot 配置...'));
    
    if (ctx.dryRun) {
      console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
      return;
    }
    
    await this.writeCopilotConfig(ctx);
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 Copilot 配置...'));
    
    for (const [originalPath, backupPath] of this.backupPaths) {
      try {
        const content = await fs.readFile(backupPath, 'utf-8');
        await fs.writeFile(originalPath, content, 'utf-8');
        console.log(chalk.yellow(`  🔄 回滚: ${originalPath}`));
      } catch (error) {
        console.error(chalk.red(`  ❌ 回滚失败 ${originalPath}: ${error}`));
      }
    }
    
    this.backupPaths.clear();
    console.log(chalk.green('✅ Copilot 配置回滚完成'));
  }

  private async writeCopilotConfig(ctx: ApplyContext): Promise<void> {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.copilot', 'config.json');
    
    try {
      // 备份现有文件
      try {
        await fs.access(configPath);
        const backup = `${configPath}.backup`;
        await fs.copyFile(configPath, backup);
        this.backupPaths.set(configPath, backup);
      } catch {
        // 文件不存在，无需备份
      }

      // 确保目录存在
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      
      // 生成配置内容
      const config = {
        enabled: true,
        model: ctx.variables.copilotModel || 'gpt-4',
        temperature: ctx.variables.temperature || 0.3
      };
      
      // 写入文件
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(chalk.gray(`  ✅ 写入 Copilot 配置文件: ${configPath}`));
      
    } catch (error) {
      console.error(chalk.red(`  ❌ 写入失败: ${error}`));
      throw error;
    }
  }
}
```

### 注册适配器

```typescript
// packages/adapters/src/index.ts
import { CopilotAdapter } from './copilot.js';

export function createAdapter(target: string): Adapter {
  switch (target) {
    case 'gemini':
      return new GeminiAdapter();
    case 'claude':
      return new ClaudeAdapter();
    case 'cursor':
      return new CursorAdapter();
    case 'openai':
      return new OpenAIAdapter();
    case 'copilot':  // 新增
      return new CopilotAdapter();
    default:
      throw new Error(`Unknown adapter: ${target}`);
  }
}
```

---

## 适配器接口

### 核心接口定义

```typescript
/**
 * 适配器接口
 * 所有适配器必须实现这个接口
 */
export interface Adapter {
  /**
   * 规划配置变更
   * @param ctx 应用上下文
   * @returns 变更详情
   */
  plan(ctx: ApplyContext): Promise<DiffResult>;

  /**
   * 应用配置
   * @param ctx 应用上下文
   */
  apply(ctx: ApplyContext): Promise<void>;

  /**
   * 回滚配置
   * @param ctx 应用上下文
   */
  rollback(ctx: ApplyContext): Promise<void>;
}

/**
 * 应用上下文
 */
export interface ApplyContext {
  target: string;                      // 目标工具名称
  dryRun: boolean;                     // 是否为试运行模式
  variables: Record<string, unknown>;  // 配置变量
}

/**
 * 差异结果
 */
export interface DiffResult {
  changes: FileChange[];  // 文件变更列表
  summary: string;        // 变更摘要
}

/**
 * 文件变更
 */
export interface FileChange {
  path: string;                           // 文件路径
  kind: 'create' | 'update' | 'delete';  // 变更类型
  description?: string;                   // 变更描述
}
```

### 方法详解

#### 1. plan() - 配置规划

**职责**:
- 分析将要进行的配置变更
- 检测文件是否已存在
- 返回变更详情供用户确认

**实现要点**:
```typescript
async plan(ctx: ApplyContext): Promise<DiffResult> {
  const changes: FileChange[] = [];
  
  // 检查每个配置文件
  const configPaths = this.getConfigPaths();
  
  for (const configPath of configPaths) {
    try {
      await fs.access(configPath);
      // 文件存在 -> 更新操作
      changes.push({ path: configPath, kind: 'update' });
    } catch {
      // 文件不存在 -> 创建操作
      changes.push({ path: configPath, kind: 'create' });
    }
  }
  
  return {
    changes,
    summary: `将创建/更新 ${changes.length} 个配置文件`
  };
}
```

#### 2. apply() - 配置应用

**职责**:
- 实际写入配置文件
- 创建备份
- 处理错误

**实现要点**:
```typescript
async apply(ctx: ApplyContext): Promise<void> {
  // 1. 检查试运行模式
  if (ctx.dryRun) {
    console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
    return;
  }
  
  // 2. 写入配置文件
  try {
    await this.writeConfigs(ctx);
  } catch (error) {
    // 3. 发生错误时自动回滚
    await this.rollback(ctx);
    throw error;
  }
}
```

#### 3. rollback() - 配置回滚

**职责**:
- 从备份恢复文件
- 清理备份记录

**实现要点**:
```typescript
async rollback(ctx: ApplyContext): Promise<void> {
  for (const [originalPath, backupPath] of this.backupPaths) {
    try {
      // 从备份恢复
      const content = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(originalPath, content, 'utf-8');
      
      // 删除备份文件（可选）
      await fs.unlink(backupPath);
    } catch (error) {
      console.error(`回滚失败: ${error}`);
    }
  }
  
  // 清空备份记录
  this.backupPaths.clear();
}
```

---

## 实现指南

### 步骤1: 确定配置文件位置

不同工具有不同的配置文件位置约定：

```typescript
// 全局配置（用户级）
const homeDir = os.homedir();
const globalConfig = path.join(homeDir, '.tool-name', 'config.json');

// 项目配置（项目级）
const projectRoot = process.cwd();
const projectConfig = path.join(projectRoot, '.tool-name-rc');
```

### 步骤2: 设计配置内容生成器

```typescript
private generateConfig(variables: Record<string, unknown>): string {
  // 方式1: JSON配置
  const config = {
    apiKey: variables.apiKey || '{{API_KEY}}',
    model: variables.model || 'default-model',
    temperature: variables.temperature || 0.7
  };
  return JSON.stringify(config, null, 2);
  
  // 方式2: YAML配置
  // return yaml.dump(config);
  
  // 方式3: TOML配置
  // return toml.stringify(config);
  
  // 方式4: Markdown配置
  // return this.generateMarkdown(variables);
}
```

### 步骤3: 实现备份机制

```typescript
private backupPaths: Map<string, string> = new Map();

private async createBackup(filePath: string): Promise<void> {
  try {
    // 检查文件是否存在
    await fs.access(filePath);
    
    // 创建备份
    const backupPath = `${filePath}.backup`;
    await fs.copyFile(filePath, backupPath);
    
    // 记录备份路径
    this.backupPaths.set(filePath, backupPath);
    
    console.log(chalk.gray(`  💾 已备份: ${filePath}`));
  } catch (error) {
    // 文件不存在，无需备份
  }
}
```

### 步骤4: 处理变量替换

```typescript
private renderTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template;
  
  // 简单变量替换
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return result;
}
```

### 步骤5: 错误处理

```typescript
private async writeConfig(ctx: ApplyContext): Promise<void> {
  const configPath = this.getConfigPath();
  
  try {
    // 1. 备份现有文件
    await this.createBackup(configPath);
    
    // 2. 确保目录存在
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    
    // 3. 生成配置内容
    const content = this.generateConfig(ctx.variables);
    
    // 4. 写入文件
    await fs.writeFile(configPath, content, 'utf-8');
    
    console.log(chalk.green(`  ✅ 成功: ${configPath}`));
    
  } catch (error: any) {
    // 错误处理
    if (error.code === 'EACCES') {
      throw new Error(`权限错误: 无法写入 ${configPath}`);
    } else if (error.code === 'ENOSPC') {
      throw new Error('磁盘空间不足');
    } else {
      throw new Error(`写入失败: ${error.message}`);
    }
  }
}
```

---

## 最佳实践

### 1. 配置文件组织

**推荐结构**:
```
~/.tool-name/              # 全局配置目录
├── config.json            # 主配置文件
├── settings.json          # 设置文件
└── cache/                 # 缓存目录

project-root/              # 项目根目录
├── .tool-name-rc          # 项目配置文件
└── .tool-name/            # 项目特定配置
    ├── commands/          # 命令配置
    └── templates/         # 模板文件
```

### 2. 配置优先级

配置加载优先级（从高到低）：

1. **命令行参数**: `--config ./custom-config.json`
2. **环境变量**: `TOOL_NAME_CONFIG=...`
3. **项目配置**: `./.tool-name-rc`
4. **用户配置**: `~/.tool-name/config.json`
5. **默认配置**: 内置默认值

### 3. 变量命名约定

```typescript
// ✅ 推荐的变量命名
{
  "projectName": "my-project",         // 驼峰命名
  "apiKey": "{{API_KEY}}",             // 大写环境变量占位符
  "enableFeature": true,               // enable前缀布尔值
  "maxTokens": 4096,                   // max/min前缀数值
  "techStack": ["React", "Node.js"]    // 数组使用复数
}

// ❌ 不推荐的命名
{
  "project_name": "...",  // 避免下划线
  "API_KEY": "...",       // 避免全大写
  "feature": true,        // 不清晰的布尔值
  "tokens": 4096          // 缺少语义
}
```

### 4. 日志输出规范

```typescript
// 使用统一的日志格式
console.log(chalk.cyan('⚡ 应用配置...'));         // 主要操作
console.log(chalk.gray('  📄 读取配置文件'));      // 次要操作
console.log(chalk.green('  ✅ 成功'));             // 成功
console.log(chalk.red('  ❌ 失败'));               // 失败
console.log(chalk.yellow('  ⚠️  警告'));           // 警告
```

### 5. 测试覆盖

每个适配器都应该有完整的单元测试：

```typescript
describe('MyAdapter', () => {
  describe('plan', () => {
    it('应该检测新文件创建');
    it('应该检测文件更新');
    it('应该检测文件删除');
  });
  
  describe('apply', () => {
    it('应该创建配置文件');
    it('应该在试运行模式下跳过写入');
    it('应该创建备份');
    it('应该替换变量');
    it('应该处理错误并回滚');
  });
  
  describe('rollback', () => {
    it('应该从备份恢复');
    it('应该处理无备份的情况');
  });
});
```

---

## 测试

### 单元测试模板

```typescript
// packages/adapters/tests/myAdapter.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MyAdapter } from '../src/myAdapter.js';
import { ApplyContext } from '../src/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('MyAdapter', () => {
  let adapter: MyAdapter;
  let testDir: string;
  let homeDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    homeDir = path.join(testDir, 'home');
    await fs.mkdir(homeDir, { recursive: true });

    // Mock os.homedir
    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
    
    // Mock process.cwd
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);

    adapter = new MyAdapter();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  it('should create config file', async () => {
    const ctx: ApplyContext = {
      target: 'mytool',
      dryRun: false,
      variables: {
        projectName: 'test-project'
      }
    };

    await adapter.apply(ctx);

    const configPath = path.join(homeDir, '.mytool', 'config.json');
    const exists = await fs.access(configPath).then(() => true).catch(() => false);
    
    expect(exists).toBe(true);
  });
});
```

### 集成测试

```typescript
// packages/adapters/tests/integration.test.ts
describe('Adapter Integration', () => {
  it('should complete full workflow', async () => {
    const adapter = new MyAdapter();
    
    const ctx: ApplyContext = {
      target: 'mytool',
      dryRun: false,
      variables: { projectName: 'test' }
    };
    
    // 1. Plan
    const planResult = await adapter.plan(ctx);
    expect(planResult.changes.length).toBeGreaterThan(0);
    
    // 2. Apply
    await adapter.apply(ctx);
    
    // 3. Verify
    // 验证文件已创建
    
    // 4. Rollback
    await adapter.rollback(ctx);
    
    // 5. Verify rollback
    // 验证文件已恢复
  });
});
```

---

## 示例

### 示例1: JSON配置适配器

```typescript
export class JSONConfigAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    return {
      changes: [{ path: '~/.tool/config.json', kind: 'create' }],
      summary: '将创建JSON配置文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    const config = {
      version: '1.0',
      settings: ctx.variables
    };
    
    const configPath = path.join(os.homedir(), '.tool', 'config.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    // Implementation...
  }
}
```

### 示例2: Markdown配置适配器

```typescript
export class MarkdownConfigAdapter implements Adapter {
  private generateMarkdown(variables: Record<string, unknown>): string {
    return `# ${variables.projectName}

## Configuration

- Model: ${variables.model}
- Temperature: ${variables.temperature}

## Rules

${(variables.rules as string[])?.map(r => `- ${r}`).join('\n')}
`;
  }

  async apply(ctx: ApplyContext): Promise<void> {
    const content = this.generateMarkdown(ctx.variables);
    const configPath = path.join(process.cwd(), 'CONFIG.md');
    await fs.writeFile(configPath, content, 'utf-8');
  }
}
```

### 示例3: 多文件适配器

```typescript
export class MultiFileAdapter implements Adapter {
  async apply(ctx: ApplyContext): Promise<void> {
    const configs = [
      {
        path: '~/.tool/main.json',
        content: this.generateMainConfig(ctx.variables)
      },
      {
        path: '~/.tool/settings.json',
        content: this.generateSettings(ctx.variables)
      },
      {
        path: './tool.config.js',
        content: this.generateProjectConfig(ctx.variables)
      }
    ];

    for (const config of configs) {
      await this.writeConfig(config.path, config.content);
    }
  }
}
```

---

## 调试技巧

### 1. 启用详细日志

```typescript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('[DEBUG] Config path:', configPath);
  console.log('[DEBUG] Variables:', JSON.stringify(variables, null, 2));
}
```

### 2. 使用试运行模式

```typescript
// 在apply中检查试运行
if (ctx.dryRun) {
  console.log(chalk.yellow('DRY RUN: Would write to', configPath));
  console.log(chalk.gray('Content:', content));
  return;
}
```

### 3. 验证配置正确性

```typescript
private async validateConfig(config: any): Promise<void> {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  
  if (config.temperature < 0 || config.temperature > 2) {
    throw new Error('Temperature must be between 0 and 2');
  }
}
```

---

## 常见问题

### Q1: 如何处理不同操作系统的路径差异？

```typescript
// 使用 path 模块处理路径
import path from 'path';
import os from 'os';

// ✅ 正确
const configPath = path.join(os.homedir(), '.tool', 'config.json');

// ❌ 错误（硬编码路径分隔符）
const configPath = os.homedir() + '/.tool/config.json';
```

### Q2: 如何处理大文件或二进制配置？

```typescript
// 使用流式写入
import { createWriteStream } from 'fs';

const stream = createWriteStream(configPath);
stream.write(content);
stream.end();
```

### Q3: 如何支持配置文件加密？

```typescript
import crypto from 'crypto';

private encrypt(content: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

---

## 发布清单

在发布新适配器前，确保完成以下检查：

- [ ] 实现了 Adapter 接口的所有方法
- [ ] 添加了详细的日志输出
- [ ] 实现了完整的错误处理
- [ ] 创建了备份机制
- [ ] 编写了单元测试（覆盖率 > 80%）
- [ ] 添加了集成测试
- [ ] 更新了适配器注册表
- [ ] 编写了使用文档
- [ ] 添加了示例配置
- [ ] 在本地测试通过
- [ ] 添加了模型签名注释

---

**文档版本**: v0.1.0  
**最后更新**: 2025-10-14  
**维护者**: meteor-shower团队  
**反馈**: https://github.com/meteor-shower/meteor-shower/issues
