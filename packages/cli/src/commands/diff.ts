import chalk from 'chalk';
import { ConfigGenerator } from '../../utils/src/config-generator.js';

export async function diffCommand() {
  console.log(chalk.cyan('🔍 分析配置差异...'));
  
  // 模拟配置生成
  const generator = new ConfigGenerator();
  const plan = await generator.generateConfig(
    ['gemini', 'claude'],
    'gemini-basic',
    { projectName: 'demo', persona: '测试工程师' }
  );
  
  console.log(chalk.yellow('📋 变更摘要:'));
  console.log(chalk.gray(`将创建 ${plan.operations.length} 个配置文件`));
  
  console.log(chalk.yellow('\n📁 文件变更:'));
  plan.operations.forEach(op => {
    const icon = op.kind === 'create' ? '➕' : op.kind === 'update' ? '🔄' : '❌';
    const color = op.kind === 'create' ? 'green' : op.kind === 'update' ? 'yellow' : 'red';
    console.log(chalk[color](`${icon} ${op.path} (${op.target})`));
  });
  
  console.log(chalk.gray('\n💡 使用 ms apply 应用这些变更'));
}
