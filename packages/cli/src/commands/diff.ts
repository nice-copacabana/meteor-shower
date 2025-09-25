import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigGenerator, ConfigPlan } from '../../utils/config-generator.js';
import { createAdapter } from '../../adapters/index.js';

export async function diffCommand() {
  console.log(chalk.cyan('🔍 分析配置差异...'));

  try {
    // 初始化配置生成器
    const configGen = new ConfigGenerator();

    // 收集用户输入
    const { toolset, template, variables } = await collectDiffInput();

    // 生成配置计划
    const plan = await configGen.generateConfig(toolset, template, variables);

    // 分析差异
    await analyzeDiff(plan);

    // 提供操作选项
    await provideDiffActions(plan);

  } catch (error) {
    console.error(chalk.red('❌ 配置差异分析失败:'), error);
    process.exit(1);
  }
}

/**
 * 收集差异分析输入
 */
async function collectDiffInput() {
  // 工具选择
  const { toolset } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'toolset',
    message: '选择要分析的 AI 工具:',
    choices: [
      { name: 'Gemini CLI', value: 'gemini', checked: true },
      { name: 'Claude Code', value: 'claude', checked: true },
      { name: 'Cursor', value: 'cursor' },
      { name: 'OpenAI/通用', value: 'openai' }
    ]
  }]);

  // 模板选择
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

  // 变量收集
  const { projectName, persona } = await inquirer.prompt([
    { type: 'input', name: 'projectName', message: '项目名称:', default: 'my-project' },
    { type: 'input', name: 'persona', message: 'AI 角色描述:', default: '你是一名严谨的全栈工程师' }
  ]);

  return { toolset, template, variables: { projectName, persona } };
}

/**
 * 分析配置差异
 */
async function analyzeDiff(plan: ConfigPlan) {
  console.log(chalk.yellow('📋 变更摘要:'));
  console.log(chalk.gray(`将影响 ${plan.toolset.length} 个工具，共 ${plan.operations.length} 个文件`));

  console.log(chalk.yellow('\n📁 文件变更:'));

  plan.operations.forEach((op, index) => {
    const icon = op.kind === 'create' ? '➕' : op.kind === 'update' ? '🔄' : '❌';
    const color = op.kind === 'create' ? 'green' : op.kind === 'update' ? 'yellow' : 'red';
    console.log(chalk[color](`${index + 1}. ${icon} ${op.path}`));
  });

  // 显示工具摘要
  const toolSummary = plan.toolset.reduce((acc, tool) => {
    acc[tool] = (acc[tool] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(chalk.yellow('\n📊 工具影响:'));
  Object.entries(toolSummary).forEach(([tool, count]) => {
    console.log(chalk.gray(`  ${tool}: ${count} 个文件`));
  });
}

/**
 * 提供差异操作选项
 */
async function provideDiffActions(plan: ConfigPlan) {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: '选择操作:',
    choices: [
      { name: '✅ 应用配置', value: 'apply' },
      { name: '👁️ 预览文件内容', value: 'preview' },
      { name: '📝 保存到文件', value: 'save' },
      { name: '❌ 取消', value: 'cancel' }
    ]
  }]);

  switch (action) {
    case 'apply':
      console.log(chalk.cyan('🔄 正在应用配置...'));
      await applyConfiguration(plan);
      break;

    case 'preview':
      await previewFiles(plan);
      break;

    case 'save':
      await savePlanToFile(plan);
      break;

    case 'cancel':
      console.log(chalk.yellow('❌ 操作已取消'));
      break;
  }
}

/**
 * 应用配置
 */
async function applyConfiguration(plan: ConfigPlan) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: '确定要应用这些配置吗？',
    default: false
  }]);

  if (!confirm) {
    console.log(chalk.yellow('❌ 操作已取消'));
    return;
  }

  // 按工具分组应用配置
  for (const tool of plan.toolset) {
    const adapter = createAdapter(tool as any);
    const toolOperations = plan.operations.filter(op => op.target === tool);

    const context = {
      target: tool as any,
      dryRun: false,
      variables: { ...plan.variables, operations: toolOperations }
    };

    try {
      await adapter.apply(context);
      console.log(chalk.green(`✅ ${tool} 配置应用成功`));
    } catch (error) {
      console.error(chalk.red(`❌ ${tool} 配置应用失败:`), error);
    }
  }

  console.log(chalk.green('🎉 所有配置应用完成！'));
}

/**
 * 预览文件内容
 */
async function previewFiles(plan: ConfigPlan) {
  const { fileIndex } = await inquirer.prompt([{
    type: 'number',
    name: 'fileIndex',
    message: '选择要预览的文件 (输入数字):',
    validate: (input) => input > 0 && input <= plan.operations.length
  }]);

  const operation = plan.operations[fileIndex - 1];
  console.log(chalk.yellow(`\n📄 文件: ${operation.path}`));
  console.log(chalk.gray('=' .repeat(50)));

  // 显示文件内容（截取前20行）
  const lines = operation.content.split('\n');
  const preview = lines.slice(0, 20).join('\n');
  console.log(preview);

  if (lines.length > 20) {
    console.log(chalk.gray(`\n... (还有 ${lines.length - 20} 行)`));
  }
}

/**
 * 保存计划到文件
 */
async function savePlanToFile(plan: ConfigPlan) {
  const fs = await import('fs/promises');
  const path = await import('path');

  const planPath = path.join(process.cwd(), 'meteor-shower-config-plan.json');
  await fs.writeFile(planPath, JSON.stringify(plan, null, 2));

  console.log(chalk.green(`✅ 配置计划已保存到: ${planPath}`));
}
