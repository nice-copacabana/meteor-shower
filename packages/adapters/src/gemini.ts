/**
 * Gemini CLI 适配器
 * 负责 Gemini AI 编程工具的配置管理和应用
 *
 * 配置文件：
 * - ~/.gemini/GEMINI.md: 主要配置文件（Markdown格式）
 * - ~/.gemini/settings.json: 设置文件（JSON格式）
 * - .gemini/commands/plan.toml: 命令规划文件（TOML格式）
 */

import { Adapter, ApplyContext, DiffResult } from './index.js';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Gemini 适配器类
 * 实现 Adapter 接口，提供 Gemini 工具的配置管理
 */
export class GeminiAdapter implements Adapter {

  /**
   * 规划配置变更
   * 分析将要进行的配置变更，返回变更详情
   *
   * @param ctx 应用上下文，包含目标信息和变量
   * @returns 变更分析结果
   */
  async plan(ctx: ApplyContext): Promise<DiffResult> {
    console.log(chalk.gray('📋 规划 Gemini 配置变更...'));

    // 基于上下文和模板变量计算将要创建的文件
    const changes = [
      { path: '~/.gemini/GEMINI.md', kind: 'create' },
      { path: '~/.gemini/settings.json', kind: 'create' },
      { path: '.gemini/commands/plan.toml', kind: 'create' }
    ];

    return {
      changes,
      summary: `将创建 ${changes.length} 个 Gemini 配置文件`
    };
  }

  /**
   * 应用配置
   * 执行实际的配置写入操作
   *
   * @param ctx 应用上下文
   */
  async apply(ctx: ApplyContext): Promise<void> {
    console.log(chalk.green('⚡ 应用 Gemini 配置...'));

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
        if (operation.target === 'gemini') {
          const expandedPath = this.expandPath(operation.path);
          await fileOps.writeFile(expandedPath, operation.content);
        }
      }

      console.log(chalk.green('✅ Gemini 配置应用完成'));
    } catch (error) {
      console.error(chalk.red('❌ Gemini 配置应用失败:'), error);
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
   * 回滚配置
   * 将配置恢复到应用前的状态
   * 安全特性：支持配置回滚
   *
   * @param ctx 应用上下文
   */
  async rollback(ctx: ApplyContext): Promise<void> {
    console.log(chalk.yellow('🔄 回滚 Gemini 配置...'));

    const { FileOperations } = await import('../utils/file-ops.js');
    const fileOps = new FileOperations();

    try {
      // 查找备份文件并恢复
      const backupDir = '.meteor-shower/backups';

      // 解析配置操作并回滚
      for (const operation of ctx.variables.operations || []) {
        if (operation.target === 'gemini') {
          const expandedPath = this.expandPath(operation.path);
          const backupFiles = await this.findBackupFiles(backupDir, operation.path);

          if (backupFiles.length > 0) {
            const latestBackup = backupFiles[0]; // 最新的备份
            await fileOps.rollbackFromBackup(latestBackup, expandedPath);
          }
        }
      }

      console.log(chalk.green('✅ Gemini 配置回滚完成'));
    } catch (error) {
      console.error(chalk.red('❌ Gemini 配置回滚失败:'), error);
      throw error;
    }
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
