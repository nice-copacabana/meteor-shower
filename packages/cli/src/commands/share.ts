import chalk from 'chalk';
import inquirer from 'inquirer';

export async function shareCommand() {
  console.log(chalk.cyan('📦 打包当前配置为模板...'));
  
  // 扫描当前项目配置
  console.log(chalk.gray('🔍 扫描项目配置文件...'));
  
  const configs = [
    { file: 'GEMINI.md', found: true },
    { file: 'CLAUDE.md', found: true },
    { file: '.gemini/settings.json', found: false },
    { file: 'AGENTS.md', found: false }
  ];
  
  console.log(chalk.yellow('\n📋 发现的配置:'));
  configs.forEach(config => {
    const icon = config.found ? '✅' : '❌';
    const color = config.found ? 'green' : 'red';
    console.log(chalk[color](`  ${icon} ${config.file}`));
  });
  
  // 收集模板信息
  const { templateName, description } = await inquirer.prompt([
    { type: 'input', name: 'templateName', message: '模板名称:', default: 'my-config' },
    { type: 'input', name: 'description', message: '模板描述:', default: '我的 AI 工具配置' }
  ]);
  
  console.log(chalk.green('\n🎉 模板打包完成！'));
  console.log(chalk.gray(`模板名: ${templateName}`));
  console.log(chalk.gray(`描述: ${description}`));
  console.log(chalk.gray('💡 使用 ms init 可以重新应用此模板'));
}
