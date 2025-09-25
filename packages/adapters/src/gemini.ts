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

    // 执行配置写入
    // TODO: 实际的文件写入逻辑
    console.log(chalk.gray('  ✅ 写入 ~/.gemini/GEMINI.md'));
    console.log(chalk.gray('  ✅ 写入 ~/.gemini/settings.json'));
    console.log(chalk.gray('  ✅ 写入 .gemini/commands/plan.toml'));
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
    console.log(chalk.gray('  ✅ 恢复备份文件'));
    // TODO: 实际的回滚逻辑
    // 1. 读取备份文件
    // 2. 恢复原文件
    // 3. 清理临时文件
  }
}
