/**
 * 适配器层 - 多工具支持的核心抽象层
 *
 * 设计模式：适配器模式 + 工厂模式
 * 目的：为不同AI工具提供统一的配置接口
 * 支持工具：Gemini CLI、Claude Code、Cursor、OpenAI
 */

// ========== 类型定义 ==========

/**
 * 支持的工具目标类型
 * 定义了当前支持配置的所有AI工具
 */
export type ToolTarget = 'gemini' | 'claude' | 'cursor' | 'openai';

/**
 * 应用上下文接口
 * 包含配置应用时的必要上下文信息
 */
export interface ApplyContext {
  target: ToolTarget;                       // 目标工具类型
  dryRun: boolean;                          // 是否为试运行模式
  variables: Record<string, unknown>;       // 模板变量
}

/**
 * 差异分析结果接口
 * 描述配置变更的具体信息
 */
export interface DiffResult {
  changes: Array<{                          // 变更列表
    path: string;                           // 变更文件路径
    kind: 'create' | 'update' | 'delete';   // 变更类型
  }>;
  summary: string;                          // 变更摘要
}

/**
 * 适配器接口
 * 定义所有工具适配器必须实现的统一接口
 *
 * 核心方法：
 * - plan: 分析变更计划（只读操作）
 * - apply: 执行配置应用（写操作）
 * - rollback: 回滚配置（可选，安全特性）
 */
export interface Adapter {
  plan(ctx: ApplyContext): Promise<DiffResult>;    // 规划变更
  apply(ctx: ApplyContext): Promise<void>;         // 执行应用
  rollback?(ctx: ApplyContext): Promise<void>;     // 可选回滚
}

// ========== 默认实现 ==========

/**
 * 空操作适配器
 * 用于不支持的工具或测试场景
 * 实现：所有操作都是无操作（noop）
 */
export class NoopAdapter implements Adapter {
  async plan(): Promise<DiffResult> {
    return { changes: [], summary: 'noop' };
  }
  async apply(): Promise<void> { /* 空操作 */ }
}

// ========== 适配器导出 ==========

// 导出所有具体适配器实现
export { GeminiAdapter } from './gemini.js';
export { ClaudeAdapter } from './claude.js';
export { CursorAdapter } from './cursor.js';
export { OpenAIAdapter } from './openai.js';

// ========== 工厂函数 ==========

/**
 * 适配器工厂函数
 * 根据目标工具类型创建对应的适配器实例
 *
 * 工作原理：
 * 1. 根据target参数匹配对应的适配器类
 * 2. 动态导入对应的适配器模块
 * 3. 返回适配器实例
 *
 * @param target 目标工具类型
 * @returns 对应的适配器实例
 */
export function createAdapter(target: ToolTarget): Adapter {
  switch (target) {
    case 'gemini':
      return new (require('./gemini.js')).GeminiAdapter();
    case 'claude':
      return new (require('./claude.js')).ClaudeAdapter();
    case 'cursor':
      return new (require('./cursor.js')).CursorAdapter();
    case 'openai':
      return new (require('./openai.js')).OpenAIAdapter();
    default:
      return new NoopAdapter();
  }
}
