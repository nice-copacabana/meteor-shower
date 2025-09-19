import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigGenerator } from '../../utils/src/config-generator.js';
import { FileOperations } from '../../utils/src/file-ops.js';

export interface ApplyOptions {
  yes?: boolean;
}

export async function applyCommand(options: ApplyOptions = {}) {
  console.log(chalk.cyan('⚡ 应用配置变更...'));
  
  if (!options.yes) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: '确定要应用这些配置变更吗？',
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('❌ 操作已取消'));
      return;
    }
  }
  
  // 生成配置计划
  const generator = new ConfigGenerator();
  const plan = await generator.generateConfig(
    ['gemini', 'claude'],
    'gemini-basic',
    { projectName: 'demo', persona: '测试工程师' }
  );
  
  // 应用配置
  const fileOps = new FileOperations();
  
  console.log(chalk.green('\n📝 应用进度:'));
  for (const op of plan.operations) {
    try {
      await fileOps.writeFile(op.path, op.content);
    } catch (error) {
      console.error(chalk.red(`❌ 应用失败 ${op.path}: ${error}`));
    }
  }
  
  console.log(chalk.green('\n🎉 配置应用成功！'));
  console.log(chalk.gray('💡 使用 ms diff 查看变更，或运行相应工具验证配置'));
}
