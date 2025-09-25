/**
 * 初始化命令模块
 * 负责引导用户完成工具集选择、模板配置和变量收集
 */

import inquirer from 'inquirer';           // 交互式命令行界面
import chalk from 'chalk';                 // 终端颜色输出

/**
 * 初始化选项接口
 * 定义用户可选择的配置参数
 */
export interface InitOptions {
  toolset?: string[];                       // 可选的工具集
  template?: string;                        // 模板选择
  variables?: Record<string, unknown>;      // 模板变量
}

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
export async function initCommand(options: InitOptions = {}) {
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
async function collectVariables(template: string, toolset: string[]) {
  const variables: Record<string, unknown> = {};

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

  // TODO: 根据不同模板和工具集收集特定的变量
  // 如：API密钥、模型偏好、代码风格等

  return variables;
}
