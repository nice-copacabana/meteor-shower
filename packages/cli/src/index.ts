/**
 * Meteor Shower CLI - AI 编程工具一键优化与同步平台
 *
 * 核心功能：
 * - init: 工具集配置与模板选择
 * - diff: 环境差异对比分析
 * - apply: 配置应用与回滚支持
 * - share: 项目规则模板化打包
 * - mcp: MCP协议服务测试
 */

// 导入核心依赖
import { Command } from 'commander';      // 命令行框架
import chalk from 'chalk';                 // 终端颜色美化
import { initCommand } from './commands/init.js';     // 初始化命令
import { diffCommand } from './commands/diff.js';     // 差异对比命令
import { applyCommand } from './commands/apply.js';    // 配置应用命令
import { shareCommand } from './commands/share.js';    // 模板分享命令
import { mcpTestCommand } from './commands/mcp.js';     // MCP服务测试命令
import { accountCommand } from './commands/account.js'; // 账户管理命令
import { createCaseCommand } from './commands/case.js';  // 案例管理命令
import { createTaskCommand } from './commands/task.js';  // 任务管理命令

// 创建命令行程序实例
const program = new Command();

// 配置CLI程序基本信息
program
  .name('ms')                                    // 命令名称
  .description('meteor-shower: 一键优化与同步 AI 编程工具的 CLI')
  .version('0.1.0');                             // 版本号

// ========== 命令定义 ==========

/**
 * 初始化命令：工具集选择与配置模板生成
 * 流程：选择AI工具 -> 加载对应模板 -> 生成应用计划
 */
program
  .command('init')
  .description('初始化：选择工具集与模板，生成应用计划')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error(chalk.red('❌ 初始化失败:'), error);
      process.exit(1);
    }
  });

/**
 * 差异对比命令：分析渲染结果与当前环境差异
 * 功能：对比模板渲染结果与实际配置，识别需要修改的部分
 */
program
  .command('diff')
  .description('对比渲染结果与当前环境差异')
  .action(async () => {
    try {
      await diffCommand();
    } catch (error) {
      console.error(chalk.red('❌ 差异分析失败:'), error);
      process.exit(1);
    }
  });

/**
 * 配置应用命令：执行配置修改并支持回滚
 * 选项：
 * - -y, --yes: 跳过确认步骤，直接应用
 * 安全特性：支持回滚机制，失败时可恢复
 */
program
  .command('apply')
  .option('-y, --yes', '跳过确认')              // 跳过用户确认选项
  .description('应用配置并支持回滚')
  .action(async (options) => {
    try {
      await applyCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ 应用失败:'), error);
      process.exit(1);
    }
  });

/**
 * 模板分享命令：将当前项目配置打包为可复用的模板
 * 用途：将成功配置的项目经验打包分享到云端
 */
program
  .command('share')
  .description('将当前项目规则打包为模板')
  .action(async () => {
    try {
      await shareCommand();
    } catch (error) {
      console.error(chalk.red('❌ 打包失败:'), error);
      process.exit(1);
    }
  });

/**
 * MCP服务测试命令：检测MCP（Model Context Protocol）服务可用性
 * 功能：验证MCP服务器连接状态和服务健康度
 */
program
  .command('mcp')
  .description('MCP 工具集')
  .command('test')
  .description('探测 MCP 服务可用性')
  .action(async () => {
    try {
      await mcpTestCommand();
    } catch (error) {
      console.error(chalk.red('❌ MCP 测试失败:'), error);
      process.exit(1);
    }
  });

/**
 * 账户管理命令：查看用户信息、配额、升级建议
 * 功能：
 * - info: 查看账户信息
 * - quota: 查看配额使用情况
 * - upgrade: 查看升级建议
 * - compare: 对比不同层级
 */
program
  .command('account [action]')
  .description('账户管理 (info|quota|upgrade|compare)')
  .action(async (action) => {
    try {
      await accountCommand({ action });
    } catch (error) {
      console.error(chalk.red('❌ 账户操作失败:'), error);
      process.exit(1);
    }
  });

/**
 * 案例管理命令：能力验证案例库管理
 * 功能：
 * - create: 创建新案例
 * - list: 列出案例
 * - show: 显示案例详情
 * - search: 搜索案例
 * - edit: 编辑案例
 * - delete: 删除案例
 * - import/export: 导入导出案例
 * - stats: 统计信息
 */
program.addCommand(createCaseCommand());

/**
 * 任务管理命令：任务协调管理
 * 功能：
 * - create: 创建新任务
 * - list: 列出任务
 * - show: 显示任务详情
 * - submit: 提交任务
 * - cancel: 取消任务
 * - add-dep: 添加依赖
 * - deps: 查看依赖
 */
program.addCommand(createTaskCommand());

program.parseAsync(process.argv);
