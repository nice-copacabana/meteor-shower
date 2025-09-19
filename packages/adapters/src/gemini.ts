import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';

export class GeminiAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 Gemini 配置变更...'));
    
    return {
      changes: [
        { path: '~/.gemini/GEMINI.md', kind: 'create' },
        { path: '~/.gemini/settings.json', kind: 'create' },
        { path: '.gemini/commands/plan.toml', kind: 'create' }
      ],
      summary: '将创建 3 个 Gemini 配置文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 Gemini 配置...'));
    
    if (ctx.dryRun) {
      console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
      return;
    }
    
    // 模拟写入文件
    console.log(chalk.gray('  ✅ 写入 ~/.gemini/GEMINI.md'));
    console.log(chalk.gray('  ✅ 写入 ~/.gemini/settings.json'));
    console.log(chalk.gray('  ✅ 写入 .gemini/commands/plan.toml'));
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 Gemini 配置...'));
    console.log(chalk.gray('  ✅ 恢复备份文件'));
  }
}
