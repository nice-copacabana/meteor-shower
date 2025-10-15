/**
 * 配置生成器模块
 * 基于模板和变量生成具体的配置操作计划
 *
 * 核心功能：
 * - 模板渲染：将模板转换为具体配置
 * - 操作规划：生成文件操作序列
 * - 多工具支持：为不同工具生成相应配置
 */
import { TemplateEngine } from './template-engine.js';
import { FileOperations } from './file-ops.js';
import chalk from 'chalk'; // 终端颜色输出
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
    async generateConfig(toolset, templateId, variables) {
        console.log(chalk.cyan('🔧 生成配置计划...'));
        // 加载并验证模板
        const template = await this.templateEngine.loadTemplate(templateId);
        const operations = [];
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
    async generateToolConfig(tool, template, variables) {
        const operations = [];
        switch (tool) {
            case 'gemini':
                operations.push({
                    target: 'gemini',
                    path: '~/.gemini/GEMINI.md',
                    content: this.generateGeminiMarkdown(template, variables),
                    kind: 'create'
                });
                operations.push({
                    target: 'gemini',
                    path: '~/.gemini/settings.json',
                    content: this.generateGeminiSettings(template, variables),
                    kind: 'create'
                });
                break;
            case 'claude':
                operations.push({
                    target: 'claude',
                    path: '~/.claude/claude.json',
                    content: this.generateClaudeConfig(template, variables),
                    kind: 'create'
                });
                operations.push({
                    target: 'claude',
                    path: './CLAUDE.md',
                    content: this.generateClaudeMarkdown(template, variables),
                    kind: 'create'
                });
                break;
            case 'cursor':
                operations.push({
                    target: 'cursor',
                    path: './.cursor/rules.txt',
                    content: this.generateCursorRules(template, variables),
                    kind: 'create'
                });
                break;
            case 'openai':
                operations.push({
                    target: 'openai',
                    path: './AGENTS.md',
                    content: this.generateAgentsMarkdown(template, variables),
                    kind: 'create'
                });
                break;
        }
        return operations;
    }
    generateGeminiMarkdown(template, variables) {
        const projectName = variables.projectName || 'my-project';
        const persona = variables.persona || '你是一名严谨的全栈工程师';
        return `# ${projectName} - Gemini 配置

## 角色定义
${persona}

## 项目规范
- 代码必须经过测试
- 遵循最佳实践
- 保持代码简洁可读

## 工作流程
1. 理解需求
2. 制定计划
3. 编写代码
4. 编写测试
5. 代码审查
`;
    }
    generateGeminiSettings(template, variables) {
        return JSON.stringify({
            model: {
                name: "gemini-1.5-pro-latest"
            },
            tools: {
                allowed: [
                    "run_shell_command(git status)",
                    "run_shell_command(npm test)",
                    "run_shell_command(npm run build)"
                ]
            },
            context: {
                fileName: "GEMINI.md",
                fileFiltering: {
                    respectGitIgnore: true,
                    respectGeminiIgnore: true
                }
            }
        }, null, 2);
    }
    generateClaudeConfig(template, variables) {
        return JSON.stringify({
            apiKey: "{{CLAUDE_API_KEY}}",
            model: "claude-3-5-sonnet-20241022",
            maxTokens: 4000,
            temperature: 0.1
        }, null, 2);
    }
    generateClaudeMarkdown(template, variables) {
        const projectName = variables.projectName || 'my-project';
        const persona = variables.persona || '你是一名经验丰富的软件工程师';
        return `# ${projectName} - Claude 配置

## 角色
${persona}

## 编码规范
- 使用 TypeScript
- 遵循 ESLint 规则
- 编写单元测试
- 保持函数简洁
`;
    }
    generateCursorRules(template, variables) {
        const projectName = variables.projectName || 'my-project';
        const persona = variables.persona || '你是一名资深架构师';
        return `# ${projectName} - Cursor 规则

${persona}

## 代码风格
- 使用现代 JavaScript/TypeScript
- 遵循项目 ESLint 配置
- 编写清晰的注释
- 保持函数单一职责

## 测试要求
- 每个新功能必须有测试
- 测试覆盖率 > 80%
- 使用 Jest 进行单元测试
`;
    }
    generateAgentsMarkdown(template, variables) {
        const projectName = variables.projectName || 'my-project';
        const persona = variables.persona || '你是一名全栈工程师';
        return `# ${projectName} - AI Agents 配置

## 角色定义
${persona}

## 项目结构
- src/ - 源代码
- tests/ - 测试文件
- docs/ - 文档
- scripts/ - 构建脚本

## 开发规范
- 使用 Git 进行版本控制
- 遵循语义化提交规范
- 代码审查必须通过
- 持续集成必须通过
`;
    }
}
