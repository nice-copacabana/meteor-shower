import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

export class OpenAIAdapter implements Adapter {
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 OpenAI 配置变更...'));

    // 基于上下文和模板变量计算将要创建的文件
    const changes = [
      { path: './.openai/config.json', kind: 'create' }
    ];

    return {
      changes,
      summary: `将创建 ${changes.length} 个 OpenAI 配置文件`
    };
  }

  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 OpenAI 配置...'));

    // 安全检查：试运行模式
    if (ctx.dryRun) {
      console.log(chalk.yellow('🔍 模拟模式：跳过实际写入'));
      return;
    }

    const { FileOperations } = await import('../utils/file-ops.js');
    const fileOps = new FileOperations();

    try {
      // 解析配置操作并执行写入
      for (const operation of ctx.variables.operations || []) {
        if (operation.target === 'openai') {
          const expandedPath = this.expandPath(operation.path);
          await fileOps.writeFile(expandedPath, operation.content);
        }
      }

      console.log(chalk.green('✅ OpenAI 配置应用完成'));
    } catch (error) {
      console.error(chalk.red('❌ OpenAI 配置应用失败:'), error);
      throw error;
    }
  }

  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 OpenAI 配置...'));

    const { FileOperations } = await import('../utils/file-ops.js');
    const fileOps = new FileOperations();

    try {
      // 查找备份文件并恢复
      const backupDir = '.meteor-shower/backups';

      // 解析配置操作并回滚
      for (const operation of ctx.variables.operations || []) {
        if (operation.target === 'openai') {
          const expandedPath = this.expandPath(operation.path);
          const backupFiles = await this.findBackupFiles(backupDir, operation.path);

          if (backupFiles.length > 0) {
            const latestBackup = backupFiles[0]; // 最新的备份
            await fileOps.rollbackFromBackup(latestBackup, expandedPath);
          }
        }
      }

      console.log(chalk.green('✅ OpenAI 配置回滚完成'));
    } catch (error) {
      console.error(chalk.red('❌ OpenAI 配置回滚失败:'), error);
      throw error;
    }
  }

  /**
   * 展开路径占位符
   * 将路径中的 ~ 替换为用户主目录
   */
  private expandPath(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return filePath;
  }

  /**
   * 快速打开源文件
   * 支持多种编辑器的自动检测和文件打开
   */
  async quickOpen(filePath: string): Promise<void> {
    const expandedPath = this.expandPath(filePath);

    console.log(chalk.cyan(`🚀 正在打开文件: ${expandedPath}`));

    const execAsync = promisify(exec);

    // 检测可用编辑器并尝试打开文件
    const editors = [
      'code',      // VS Code
      'cursor',    // Cursor
      'vim',       // Vim
      'nano',      // Nano
      'open'       // macOS open command
    ];

    for (const editor of editors) {
      try {
        if (editor === 'open') {
          // macOS
          await execAsync(`open "${expandedPath}"`);
        } else {
          // 其他编辑器
          await execAsync(`${editor} "${expandedPath}"`);
        }
        console.log(chalk.green(`✅ 使用 ${editor} 打开文件成功`));
        return;
      } catch (error) {
        // 尝试下一个编辑器
        continue;
      }
    }

    console.log(chalk.yellow('⚠️ 未找到可用编辑器，请手动打开文件:'));
    console.log(chalk.gray(`   文件路径: ${expandedPath}`));
  }

  /**
   * 查找备份文件
   */
  private async findBackupFiles(backupDir: string, originalPath: string): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const files = await fs.readdir(backupDir);
      const fileName = path.basename(originalPath);

      return files
        .filter(file => file.startsWith(`${fileName}.`) && file.endsWith('.bak'))
        .sort()
        .reverse(); // 最新的在前面
    } catch {
      return [];
    }
  }
}
