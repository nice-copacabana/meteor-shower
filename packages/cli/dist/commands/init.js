/**
 * 初始化命令模块
 * 负责引导用户完成工具集选择、模板配置和变量收集
 */
import inquirer from 'inquirer'; // 交互式命令行界面
import chalk from 'chalk'; // 终端颜色输出
/**
 * 初始化命令主函数
 * 引导用户完成完整的配置初始化流程
 *
 * 流程步骤：
 * 1. 工具集选择 - 复选框形式选择要配置的AI工具
 * 2. 模板选择 - 单选框选择配置模板
 * 3. 变量收集 - 根据模板和工具集收集必要变量
 * 4. 结果输出 - 显示配置摘要
 *
 * @param options 初始化选项，可选的预设参数
 * @returns 包含工具集、模板和变量的配置对象
 */
export async function initCommand(options = {}) {
    console.log(chalk.cyan('🚀 初始化 meteor-shower 配置...'));
    // ========== 第1步：工具集选择 ==========
    // 使用复选框让用户选择要配置的AI工具
    // 默认选中 Gemini 和 Claude（最常用的组合）
    const { toolset } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'toolset',
            message: '选择要配置的 AI 工具:',
            choices: [
                { name: 'Gemini CLI', value: 'gemini', checked: true },
                { name: 'Claude Code', value: 'claude', checked: true },
                { name: 'Cursor', value: 'cursor' },
                { name: 'OpenAI/通用', value: 'openai' }
            ]
        }]);
    // ========== 第2步：模板选择 ==========
    // 根据选择的工具集推荐最适合的模板
    const { template } = await inquirer.prompt([{
            type: 'list',
            name: 'template',
            message: '选择配置模板:',
            choices: [
                { name: '基础模板 (推荐)', value: 'gemini-basic' },
                { name: 'Claude 基础模板', value: 'claude-basic' },
                { name: '高级多工具模板', value: 'advanced-multi' }
            ]
        }]);
    // ========== 第3步：变量收集 ==========
    // 根据模板和工具集收集用户特定的配置变量
    const variables = await collectVariables(template, toolset);
    // ========== 第4步：结果输出 ==========
    console.log(chalk.green('✅ 初始化完成！'));
    console.log(chalk.gray(`工具集: ${toolset.join(', ')}`));
    console.log(chalk.gray(`模板: ${template}`));
    console.log(chalk.gray(`变量: ${Object.keys(variables).length} 个`));
    return { toolset, template, variables };
}
/**
 * 变量收集函数
 * 根据选择的模板和工具集，收集用户特定的配置变量
 *
 * 变量类型：
 * - projectName: 项目名称，用于个性化配置
 * - persona: AI角色描述，影响工具的行为和响应风格
 *
 * @param template 选择的模板名称
 * @param toolset 选择的工具集数组
 * @returns 收集的变量对象
 */
async function collectVariables(template, toolset) {
    const variables = {};
    // 收集基础变量
    // 这些变量会被模板引擎用于渲染配置
    const { projectName, persona } = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: '项目名称:',
            default: 'my-project'
        },
        {
            type: 'input',
            name: 'persona',
            message: 'AI 角色描述:',
            default: '你是一名严谨的全栈工程师'
        }
    ]);
    variables.projectName = projectName;
    variables.persona = persona;
    variables.projectDescription = `${projectName} - AI 辅助开发项目`;
    // 根据不同模板和工具集收集特定的变量
    await collectTemplateSpecificVariables(variables, template);
    await collectToolSpecificVariables(variables, toolset);
    return variables;
}
/**
 * 收集模板特定的变量
 * 根据选择的模板收集额外的配置变量
 *
 * @param variables 变量对象（会被修改）
 * @param template 模板名称
 */
async function collectTemplateSpecificVariables(variables, template) {
    if (template === 'advanced-multi') {
        // 高级多工具模板需要额外的配置
        const advanced = await inquirer.prompt([
            {
                type: 'list',
                name: 'primaryLanguage',
                message: '主要编程语言:',
                choices: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust']
            },
            {
                type: 'list',
                name: 'framework',
                message: '主要框架:',
                choices: ['React', 'Vue', 'Angular', 'Express', 'FastAPI', 'Spring Boot', '其他']
            },
            {
                type: 'confirm',
                name: 'useTypeScript',
                message: '使用 TypeScript?',
                default: true
            }
        ]);
        Object.assign(variables, advanced);
    }
    if (template.includes('claude')) {
        // Claude 模板的特定变量
        const claude = await inquirer.prompt([
            {
                type: 'list',
                name: 'responseStyle',
                message: 'Claude 响应风格:',
                choices: ['简洁', '详细', '教学式', '协作式'],
                default: '协作式'
            }
        ]);
        variables.responseStyle = claude.responseStyle;
    }
}
/**
 * 收集工具特定的变量
 * 根据选择的工具集收集每个工具的特定配置
 *
 * @param variables 变量对象（会被修改）
 * @param toolset 工具集数组
 */
async function collectToolSpecificVariables(variables, toolset) {
    // Gemini 特定配置
    if (toolset.includes('gemini')) {
        const gemini = await inquirer.prompt([
            {
                type: 'list',
                name: 'geminiModel',
                message: 'Gemini 模型选择:',
                choices: ['gemini-pro', 'gemini-pro-vision'],
                default: 'gemini-pro'
            },
            {
                type: 'number',
                name: 'temperature',
                message: 'Gemini 温度参数 (0.0-1.0):',
                default: 0.7,
                validate: (value) => value >= 0 && value <= 1
            }
        ]);
        variables.geminiModel = gemini.geminiModel;
        variables.temperature = gemini.temperature;
    }
    // Claude 特定配置
    if (toolset.includes('claude')) {
        const claude = await inquirer.prompt([
            {
                type: 'list',
                name: 'claudeModel',
                message: 'Claude 模型选择:',
                choices: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                default: 'claude-3-sonnet'
            },
            {
                type: 'confirm',
                name: 'enableVision',
                message: '启用 Claude 视觉功能?',
                default: false
            }
        ]);
        variables.claudeModel = claude.claudeModel;
        variables.enableVision = claude.enableVision;
    }
    // Cursor 特定配置
    if (toolset.includes('cursor')) {
        const cursor = await inquirer.prompt([
            {
                type: 'list',
                name: 'cursorModel',
                message: 'Cursor AI 模型:',
                choices: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
                default: 'gpt-4'
            },
            {
                type: 'confirm',
                name: 'enableComposer',
                message: '启用 Cursor Composer?',
                default: true
            }
        ]);
        variables.cursorModel = cursor.cursorModel;
        variables.enableComposer = cursor.enableComposer;
    }
    // OpenAI 特定配置
    if (toolset.includes('openai')) {
        const openai = await inquirer.prompt([
            {
                type: 'list',
                name: 'openaiModel',
                message: 'OpenAI 模型选择:',
                choices: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                default: 'gpt-4'
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: '最大 token 数:',
                default: 4096,
                validate: (value) => value > 0 && value <= 128000
            },
            {
                type: 'confirm',
                name: 'streamResponse',
                message: '启用流式响应?',
                default: true
            }
        ]);
        variables.openaiModel = openai.openaiModel;
        variables.maxTokens = openai.maxTokens;
        variables.streamResponse = openai.streamResponse;
    }
    // 代码风格相关配置（所有工具通用）
    const codeStyle = await inquirer.prompt([
        {
            type: 'list',
            name: 'indentStyle',
            message: '代码缩进风格:',
            choices: ['2 spaces', '4 spaces', 'tabs'],
            default: '2 spaces'
        },
        {
            type: 'confirm',
            name: 'enablePrettier',
            message: '启用 Prettier 格式化?',
            default: true
        },
        {
            type: 'confirm',
            name: 'enableESLint',
            message: '启用 ESLint 检查?',
            default: true
        }
    ]);
    Object.assign(variables, codeStyle);
}
