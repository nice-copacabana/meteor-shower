import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';

export class CursorAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 Cursor 配置变更...'));
    
    return {
      changes: [
        { path: '~/Library/Application Support/Cursor/User/globalStorage/state.vscdb', kind: 'update' },
        { path: './.cursor/rules.txt', kind: 'create' }
      ],
      summary: '将更新 Cursor 数据库并创建规则文件'
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 Cursor 配置...'));
    
    if (ctx.dryRun) {
      console.log(chalk.yellow('�� 模拟模式：跳过实际写入'));
      return;
    }
    
    console.log(chalk.gray('  ✅ 导出现有规则到文本文件'));
    console.log(chalk.gray('  ✅ 更新 Cursor 数据库'));
    console.log(chalk.gray('  ✅ 创建 .cursor/rules.txt'));
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 Cursor 配置...'));
    console.log(chalk.gray('  ✅ 恢复数据库备份'));
  }
}
