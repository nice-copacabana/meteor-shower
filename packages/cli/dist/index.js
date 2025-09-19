import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { diffCommand } from './commands/diff.js';
import { applyCommand } from './commands/apply.js';
import { shareCommand } from './commands/share.js';
import { mcpTestCommand } from './commands/mcp.js';
const program = new Command();
program
    .name('ms')
    .description('meteor-shower: 一键优化与同步 AI 编程工具的 CLI')
    .version('0.1.0');
program
    .command('init')
    .description('初始化：选择工具集与模板，生成应用计划')
    .action(async () => {
    try {
        await initCommand();
    }
    catch (error) {
        console.error(chalk.red('❌ 初始化失败:'), error);
        process.exit(1);
    }
});
program
    .command('diff')
    .description('对比渲染结果与当前环境差异')
    .action(async () => {
    try {
        await diffCommand();
    }
    catch (error) {
        console.error(chalk.red('❌ 差异分析失败:'), error);
        process.exit(1);
    }
});
program
    .command('apply')
    .option('-y, --yes', '跳过确认')
    .description('应用配置并支持回滚')
    .action(async (options) => {
    try {
        await applyCommand(options);
    }
    catch (error) {
        console.error(chalk.red('❌ 应用失败:'), error);
        process.exit(1);
    }
});
program
    .command('share')
    .description('将当前项目规则打包为模板')
    .action(async () => {
    try {
        await shareCommand();
    }
    catch (error) {
        console.error(chalk.red('❌ 打包失败:'), error);
        process.exit(1);
    }
});
program
    .command('mcp')
    .description('MCP 工具集')
    .command('test')
    .description('探测 MCP 服务可用性')
    .action(async () => {
    try {
        await mcpTestCommand();
    }
    catch (error) {
        console.error(chalk.red('❌ MCP 测试失败:'), error);
        process.exit(1);
    }
});
program.parseAsync(process.argv);
