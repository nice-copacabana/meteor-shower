/**
 * 配置生成器模块
 * 基于模板和变量生成具体的配置操作计划
 *
 * 核心功能：
 * - 模板渲染：将模板转换为具体配置
 * - 操作规划：生成文件操作序列
 * - 多工具支持：为不同工具生成相应配置
 */

import { TemplateEngine, TemplateMetadata } from './template-engine.js';
import { FileOperations } from './file-ops.js';
import chalk from 'chalk';                 // 终端颜色输出

/**
 * 配置计划接口
 * 定义配置生成的结果和执行计划
 */
export interface ConfigPlan {
  toolset: string[];                        // 目标工具集
  template: string;                         // 使用的模板ID
  variables: Record<string, unknown>;       // 变量值
  operations: Array<{                       // 具体的文件操作序列
    target: string;                         // 目标工具类型
    path: string;                           // 目标文件路径
    content: string;                        // 文件内容
    kind: 'create' | 'update' | 'delete';   // 操作类型
  }>;
}

/**
 * 配置生成器类
 * 负责将模板和变量转换为具体的配置操作计划
 *
 * 工作流程：
 * 1. 加载和验证模板
 * 2. 为每个目标工具生成配置
 * 3. 生成文件操作序列
 * 4. 返回完整的配置计划
 */
export class ConfigGenerator {
  private templateEngine: TemplateEngine;   // 模板引擎实例
  private fileOps: FileOperations;          // 文件操作实例

  /**
   * 构造函数
   * 初始化模板引擎和文件操作实例
   */
  constructor() {
    this.templateEngine = new TemplateEngine();
    this.fileOps = new FileOperations();
  }

  /**
   * 生成配置计划
   * 基于工具集、模板和变量生成完整的配置操作计划
   *
   * @param toolset 目标工具集合
   * @param templateId 模板ID
   * @param variables 变量映射
   * @returns 完整的配置计划，包含所有文件操作
   */
  async generateConfig(toolset: string[], templateId: string, variables: Record<string, unknown>): Promise<ConfigPlan> {
    console.log(chalk.cyan('🔧 生成配置计划...'));

    // 加载并验证模板
    const template = await this.templateEngine.loadTemplate(templateId);
    const operations: ConfigPlan['operations'] = [];

    // 为每个目标工具生成对应的配置操作
    for (const tool of toolset) {
      const configs = await this.generateToolConfig(tool, template, variables);
      operations.push(...configs);
    }

    return {
      toolset,
      template: templateId,
      variables,
      operations
    };
  }

  private async generateToolConfig(tool: string, template: TemplateMetadata, variables: Record<string, unknown>) {
    const operations: ConfigPlan['operations'] = [];

    switch (tool) {
      case 'gemini':
        return this.generateGeminiConfig(template, variables);
      case 'claude':
        return this.generateClaudeConfig(template, variables);
      case 'cursor':
        return this.generateCursorConfig(template, variables);
      case 'openai':
        return this.generateOpenAIConfig(template, variables);
      default:
        throw new Error(`不支持的工具类型: ${tool}`);
    }
  }

  /**
   * 生成Gemini配置文件
   */
  private async generateGeminiConfig(template: TemplateMetadata, variables: Record<string, unknown>) {
    const operations: ConfigPlan['operations'] = [];
    const { projectName, persona } = variables;

    // 生成GEMINI.md主配置文件
    const geminiMdContent = `# Gemini AI 配置
项目: ${projectName}
创建时间: ${new Date().toISOString()}

## 角色定义
${persona}

## 工作规则
1. 代码质量优先，确保可读性和可维护性
2. 遵循项目的编码规范和最佳实践
3. 提供详细的注释和文档
4. 进行充分的错误处理
5. 考虑性能和安全性

## 工具使用
- 使用TypeScript进行类型安全的开发
- 遵循ESLint和Prettier的代码格式要求
- 使用Jest进行单元测试
- 使用Git进行版本控制
`;

    // 生成settings.json配置文件
    const settingsContent = JSON.stringify({
      project: projectName,
      version: "1.0.0",
      ai: {
        model: "gemini-pro",
        temperature: 0.7,
        maxTokens: 4096,
        persona: persona
      },
      tools: {
        typescript: true,
        linting: true,
        testing: true
      },
      created: new Date().toISOString()
    }, null, 2);

    // 生成commands目录
    const commandsDir = '.gemini/commands';
    const planTomlContent = `# Gemini 命令规划配置
[project]
name = "${projectName}"
type = "typescript"

[ai]
provider = "gemini"
model = "gemini-pro"

[commands]
init = "npm install"
build = "npm run build"
test = "npm test"
lint = "npm run lint"
`;

    operations.push({
      target: 'gemini',
      path: '~/.gemini/GEMINI.md',
      content: geminiMdContent,
      kind: 'create'
    });

    operations.push({
      target: 'gemini',
      path: '~/.gemini/settings.json',
      content: settingsContent,
      kind: 'create'
    });

    operations.push({
      target: 'gemini',
      path: `${commandsDir}/plan.toml`,
      content: planTomlContent,
      kind: 'create'
    });

    return operations;
  }

  /**
   * 生成Claude配置文件
   */
  private async generateClaudeConfig(template: TemplateMetadata, variables: Record<string, unknown>) {
    const operations: ConfigPlan['operations'] = [];
    const { projectName, persona } = variables;

    // 生成Claude配置文件
    const claudeConfigContent = JSON.stringify({
      project: projectName,
      version: "1.0.0",
      ai: {
        provider: "claude",
        model: "claude-3-sonnet-20240229",
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: persona
      },
      preferences: {
        language: "typescript",
        framework: "react",
        styling: "css-modules",
        testing: "jest"
      },
      rules: {
        codeQuality: "high",
        documentation: "comprehensive",
        testing: "required",
        security: "priority"
      },
      created: new Date().toISOString()
    }, null, 2);

    operations.push({
      target: 'claude',
      path: '~/.claude/claude_desktop_config.json',
      content: claudeConfigContent,
      kind: 'create'
    });

    return operations;
  }

  /**
   * 生成Cursor配置文件
   */
  private async generateCursorConfig(template: TemplateMetadata, variables: Record<string, unknown>) {
    const operations: ConfigPlan['operations'] = [];
    const { projectName, persona } = variables;

    // 生成Cursor规则文件
    const cursorRulesContent = `# Cursor AI 规则配置
项目: ${projectName}
创建时间: ${new Date().toISOString()}

## AI 角色
${persona}

## 开发规则
- 优先考虑代码质量和用户体验
- 保持代码的一致性和可读性
- 实现充分的错误处理
- 编写有意义的测试用例
- 提供清晰的代码注释

## 技术栈
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL/MongoDB
- 样式: Tailwind CSS
- 测试: Jest + React Testing Library

## 工作流程
1. 分析需求，制定实现计划
2. 编写代码，实现功能
3. 添加测试，确保质量
4. 编写文档，说明用法
5. 进行代码审查和优化
`;

    operations.push({
      target: 'cursor',
      path: './.cursorrules',
      content: cursorRulesContent,
      kind: 'create'
    });

    return operations;
  }

  /**
   * 生成OpenAI配置文件
   */
  private async generateOpenAIConfig(template: TemplateMetadata, variables: Record<string, unknown>) {
    const operations: ConfigPlan['operations'] = [];
    const { projectName, persona } = variables;

    // 生成OpenAI配置文件
    const openaiConfigContent = JSON.stringify({
      project: projectName,
      version: "1.0.0",
      provider: "openai",
      model: "gpt-4",
      configuration: {
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        system_message: persona
      },
      capabilities: {
        code_generation: true,
        code_review: true,
        documentation: true,
        testing: true,
        debugging: true
      },
      preferences: {
        language: "TypeScript",
        style: "modern",
        complexity: "intermediate"
      },
      created: new Date().toISOString()
    }, null, 2);

    operations.push({
      target: 'openai',
      path: './.openai/config.json',
      content: openaiConfigContent,
      kind: 'create'
    });

    return operations;
  }

}
