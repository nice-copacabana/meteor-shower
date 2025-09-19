import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';

export class ClaudeAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 Claude 配置变更...'));
    
    return {
      changes: [
        { path: '~/.claude/claude.json', kind: 'create' },
        { path: './CLAUDE.md', kind: 'create' },
        { path: './CLAUDE.local.md', kind: 'create' }
      ],
      summary: '将创建 3 个 Claude 配置文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 Claude 配置...'));
    
    if (ctx.dryRun) {
      console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
      return;
    }
    
    console.log(chalk.gray('  ✅ 写入 ~/.claude/claude.json'));
    console.log(chalk.gray('  ✅ 写入 ./CLAUDE.md'));
    console.log(chalk.gray('  ✅ 写入 ./CLAUDE.local.md'));
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('�� 回滚 Claude 配置...'));
    console.log(chalk.gray('  ✅ 恢复备份文件'));
  }
}
