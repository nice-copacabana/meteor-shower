import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigGenerator, ConfigPlan } from '../../utils/config-generator.js';
import { createAdapter } from '../../adapters/index.js';
import { FileOperations } from '../../utils/file-ops.js';

export interface ApplyOptions {
  yes?: boolean;
  configFile?: string;
}

export async function applyCommand(options: ApplyOptions = {}) {
  console.log(chalk.cyan('⚡ 应用配置变更...'));

  try {
    let plan: ConfigPlan;

    // 检查是否指定了配置文件
    if (options.configFile) {
      plan = await loadConfigFromFile(options.configFile);
    } else {
      // 生成新的配置计划
      plan = await generateNewConfigPlan();
    }

    // 确认应用
    if (!options.yes) {
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
    }

    // 执行应用
    await executeApply(plan);

  } catch (error) {
    console.error(chalk.red('❌ 配置应用失败:'), error);
    process.exit(1);
  }
}

/**
 * 从文件加载配置计划
 */
async function loadConfigFromFile(configPath: string): Promise<ConfigPlan> {
  const fs = await import('fs/promises');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as ConfigPlan;
  } catch (error) {
    throw new Error(`无法加载配置文件 ${configPath}: ${error}`);
  }
}

/**
 * 生成新的配置计划
 */
async function generateNewConfigPlan(): Promise<ConfigPlan> {
  const configGen = new ConfigGenerator();

  // 工具选择
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

  // 生成配置计划
  return await configGen.generateConfig(toolset, template, { projectName, persona });
}

/**
 * 执行配置应用
 */
async function executeApply(plan: ConfigPlan): Promise<void> {
  console.log(chalk.green('\n📝 应用进度:'));

  const fileOps = new FileOperations();
  const appliedFiles: string[] = [];

  // 按工具分组应用配置
  for (const tool of plan.toolset) {
    console.log(chalk.cyan(`\n🔧 配置 ${tool}...`));

    const adapter = createAdapter(tool as any);
    const toolOperations = plan.operations.filter(op => op.target === tool);

    const context = {
      target: tool as any,
      dryRun: false,
      variables: { ...plan.variables, operations: toolOperations }
    };

    try {
      // 备份现有文件
      for (const operation of toolOperations) {
        const { FileOperations } = await import('../../utils/file-ops.js');
        const expandedPath = expandPath(operation.path);

        if (operation.kind === 'create' || operation.kind === 'update') {
          const backupPath = await fileOps.createBackup(expandedPath);
          if (backupPath) {
            appliedFiles.push(expandedPath);
          }
        }
      }

      // 应用配置
      await adapter.apply(context);

      console.log(chalk.green(`  ✅ ${tool} 配置应用成功`));

      // 提供快速打开选项
      await offerQuickOpen(toolOperations);

    } catch (error) {
      console.error(chalk.red(`  ❌ ${tool} 配置应用失败:`), error);

      // 询问是否回滚
      const { rollback } = await inquirer.prompt([{
        type: 'confirm',
        name: 'rollback',
        message: `是否回滚 ${tool} 的配置？`,
        default: true
      }]);

      if (rollback) {
        try {
          await adapter.rollback!(context);
          console.log(chalk.yellow(`  🔄 ${tool} 配置已回滚`));
        } catch (rollbackError) {
          console.error(chalk.red(`  ❌ ${tool} 配置回滚失败:`), rollbackError);
        }
      }
    }
  }

  console.log(chalk.green('\n🎉 配置应用完成！'));

  // 显示应用的文件列表
  if (appliedFiles.length > 0) {
    console.log(chalk.yellow('\n📁 应用的文件:'));
    appliedFiles.forEach(file => {
      console.log(chalk.gray(`  ✅ ${file}`));
    });
  }

  console.log(chalk.gray('\n💡 使用 ms diff 查看变更，或运行相应工具验证配置'));
}

/**
 * 提供快速打开文件选项
 */
async function offerQuickOpen(operations: any[]) {
  const { openFiles } = await inquirer.prompt([{
    type: 'confirm',
    name: 'openFiles',
    message: '是否快速打开生成的文件？',
    default: false
  }]);

  if (openFiles) {
    for (const operation of operations) {
      if (operation.kind === 'create' || operation.kind === 'update') {
        try {
          const expandedPath = expandPath(operation.path);
          const { FileOperations } = await import('../../utils/file-ops.js');
          const fileOps = new FileOperations();

          // 检查文件是否存在
          if (await fileOps.fileExists(expandedPath)) {
            await quickOpenFile(expandedPath);
          }
        } catch (error) {
          console.log(chalk.yellow(`  ⚠️ 无法打开文件: ${operation.path}`));
        }
      }
    }
  }
}

/**
 * 展开路径占位符
 */
function expandPath(filePath: string): string {
  const os = require('os');
  const path = require('path');

  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * 快速打开文件
 */
async function quickOpenFile(filePath: string): Promise<void> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  console.log(chalk.cyan(`  🚀 正在打开文件: ${filePath}`));

  // 检测可用编辑器
  const editors = ['code', 'cursor', 'vim', 'nano'];

  for (const editor of editors) {
    try {
      await execAsync(`${editor} "${filePath}"`);
      console.log(chalk.green(`  ✅ 使用 ${editor} 打开成功`));
      return;
    } catch (error) {
      continue;
    }
  }

  console.log(chalk.yellow(`  ⚠️ 未找到可用编辑器，请手动打开: ${filePath}`));
}
