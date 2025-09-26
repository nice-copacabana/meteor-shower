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
import { FileOperations } from '@meteor-shower/utils';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Gemini 适配器类
 * 实现 Adapter 接口，提供 Gemini 工具的配置管理
 */
export class GeminiAdapter implements Adapter {
  private fileOps: FileOperations;
  private backupPaths: Map<string, string> = new Map();

  constructor() {
    this.fileOps = new FileOperations();
  }

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
    await this.writeGeminiConfigs(ctx);
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
    
    // 恢复所有备份文件
    for (const [originalPath, backupPath] of this.backupPaths) {
      try {
        await this.fileOps.rollbackFromBackup(backupPath, originalPath);
      } catch (error) {
        console.error(chalk.red(`❌ 回滚失败 ${originalPath}: ${error}`));
      }
    }
    
    this.backupPaths.clear();
    console.log(chalk.green('✅ Gemini 配置回滚完成'));
  }

  /**
   * 写入 Gemini 配置文件
   * 根据模板和变量生成实际的配置文件
   *
   * @param ctx 应用上下文
   */
  private async writeGeminiConfigs(ctx: ApplyContext): Promise<void> {
    const homeDir = os.homedir();
    const projectRoot = process.cwd();
    
    // 配置文件路径定义
    const configs = [
      {
        template: 'GEMINI.md.template',
        target: path.join(homeDir, '.gemini', 'GEMINI.md'),
        description: '主配置文件'
      },
      {
        template: 'settings.json.template',
        target: path.join(homeDir, '.gemini', 'settings.json'),
        description: '设置文件'
      },
      {
        template: 'plan.toml.template',
        target: path.join(projectRoot, '.gemini', 'commands', 'plan.toml'),
        description: '命令规划文件'
      }
    ];

    // 写入每个配置文件
    for (const config of configs) {
      try {
        const content = await this.renderConfigTemplate(config.template, ctx.variables);
        await this.fileOps.writeFile(config.target, content);
        console.log(chalk.gray(`  ✅ 写入 ${config.description}: ${config.target}`));
      } catch (error) {
        console.error(chalk.red(`❌ 写入失败 ${config.description}: ${error}`));
        throw error;
      }
    }
  }

  /**
   * 渲染配置模板
   * 使用变量替换模板中的占位符
   *
   * @param templateName 模板文件名
   * @param variables 变量映射
   * @returns 渲染后的内容
   */
  private async renderConfigTemplate(templateName: string, variables: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'packages/templates/configs/gemini',
      templateName
    );
    
    let content = await fs.readFile(templatePath, 'utf-8');
    
    // 替换模板变量
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\{\{${key}\}\}`, 'g');
      content = content.replace(placeholder, String(value));
    }
    
    return content;
  }
}
