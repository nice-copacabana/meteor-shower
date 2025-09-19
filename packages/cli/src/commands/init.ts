import inquirer from 'inquirer';
import chalk from 'chalk';

export interface InitOptions {
  toolset?: string[];
  template?: string;
  variables?: Record<string, unknown>;
}

export async function initCommand(options: InitOptions = {}) {
  console.log(chalk.cyan('🚀 初始化 meteor-shower 配置...'));
  
  // 选择工具集
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

  // 选择模板
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

  // 收集变量
  const variables = await collectVariables(template, toolset);
  
  console.log(chalk.green('✅ 初始化完成！'));
  console.log(chalk.gray(`工具集: ${toolset.join(', ')}`));
  console.log(chalk.gray(`模板: ${template}`));
  console.log(chalk.gray(`变量: ${Object.keys(variables).length} 个`));
  
  return { toolset, template, variables };
}

async function collectVariables(template: string, toolset: string[]) {
  const variables: Record<string, unknown> = {};
  
  const { projectName, persona } = await inquirer.prompt([
    { type: 'input', name: 'projectName', message: '项目名称:', default: 'my-project' },
    { type: 'input', name: 'persona', message: 'AI 角色描述:', default: '你是一名严谨的全栈工程师' }
  ]);
  
  variables.projectName = projectName;
  variables.persona = persona;
  
  return variables;
}
