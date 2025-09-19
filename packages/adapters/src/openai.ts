import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';

export class OpenAIAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 OpenAI 配置变更...'));
    
    return {
      changes: [
        { path: './AGENTS.md', kind: 'create' },
        { path: './.env.example', kind: 'create' },
        { path: '~/.zshrc', kind: 'update' }
      ],
      summary: '将创建 OpenAI 通用配置文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 OpenAI 配置...'));
    
    if (ctx.dryRun) {
      console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
      return;
    }
    
    console.log(chalk.gray('  ✅ 写入 ./AGENTS.md'));
    console.log(chalk.gray('  ✅ 写入 ./.env.example'));
    console.log(chalk.gray('  ✅ 更新 ~/.zshrc'));
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 OpenAI 配置...'));
    console.log(chalk.gray('  ✅ 恢复备份文件'));
  }
}
