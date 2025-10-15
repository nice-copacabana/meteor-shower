/**
 * ExecutionEngine - 案例执行引擎
 * 
 * 负责在多个AI工具上执行验证案例
 * 支持单个执行、批量执行、并发控制、超时管理
 */

import Database from 'better-sqlite3';
import { ValidationCase, CaseExecution } from './index.js';
import { ValidationCaseDAO, CaseExecutionDAO } from './database/dao.js';

/**
 * 执行参数
 */
export interface ExecutionParams {
  caseId: string;
  tool: string;  // 工具名称: gemini, claude, cursor, openai等
  model?: string; // 模型名称
  config?: Record<string, any>; // 工具配置
  timeout?: number; // 超时时间(毫秒)
}

/**
 * 批量执行参数
 */
export interface BatchExecutionParams {
  caseIds: string[];
  tools: string[];
  config?: Record<string, any>;
  maxConcurrency?: number; // 最大并发数
  timeout?: number;
}

/**
 * 执行状态
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  id: string;
  params: ExecutionParams;
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

/**
 * 工具适配器接口
 */
export interface ToolAdapter {
  name: string;
  execute(input: string, config?: Record<string, any>): Promise<string>;
  isAvailable(): Promise<boolean>;
}

/**
 * 执行引擎
 */
export class ExecutionEngine {
  private db: Database.Database;
  private caseDAO: ValidationCaseDAO;
  private executionDAO: CaseExecutionDAO;
  private adapters: Map<string, ToolAdapter>;
  private runningExecutions: Map<string, ExecutionContext>;
  private executionQueue: ExecutionContext[];
  private maxConcurrency: number;

  constructor(db: Database.Database, maxConcurrency: number = 3) {
    this.db = db;
    this.caseDAO = new ValidationCaseDAO(db);
    this.executionDAO = new CaseExecutionDAO(db);
    this.adapters = new Map();
    this.runningExecutions = new Map();
    this.executionQueue = [];
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 注册工具适配器
   */
  registerAdapter(adapter: ToolAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * 获取已注册的工具列表
   */
  getAvailableTools(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 检查工具是否可用
   */
  async isToolAvailable(tool: string): Promise<boolean> {
    const adapter = this.adapters.get(tool);
    if (!adapter) return false;
    return adapter.isAvailable();
  }

  /**
   * 执行单个案例
   */
  async executeCase(params: ExecutionParams): Promise<CaseExecution> {
    // 验证案例存在
    const validationCase = this.caseDAO.findById(params.caseId);
    if (!validationCase) {
      throw new Error(`案例 ${params.caseId} 不存在`);
    }

    // 验证工具适配器
    const adapter = this.adapters.get(params.tool);
    if (!adapter) {
      throw new Error(`工具 ${params.tool} 未注册`);
    }

    // 检查工具可用性
    const available = await adapter.isAvailable();
    if (!available) {
      throw new Error(`工具 ${params.tool} 当前不可用`);
    }

    // 创建执行上下文
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context: ExecutionContext = {
      id: executionId,
      params,
      status: ExecutionStatus.PENDING
    };

    this.runningExecutions.set(executionId, context);

    try {
      // 更新状态为运行中
      context.status = ExecutionStatus.RUNNING;
      context.startTime = new Date();

      // 构造输入提示
      const input = this.buildPrompt(validationCase);

      // 执行案例（带超时控制）
      const timeout = params.timeout || 300000; // 默认5分钟
      const output = await this.executeWithTimeout(
        () => adapter.execute(input, params.config),
        timeout
      );

      // 记录结束时间
      context.endTime = new Date();
      context.status = ExecutionStatus.COMPLETED;

      // 计算执行时长
      const duration = context.endTime.getTime() - context.startTime.getTime();

      // 创建执行记录（暂不评分）
      const execution: Omit<CaseExecution, 'id'> = {
        caseId: params.caseId,
        tool: params.tool,
        model: params.model,
        config: params.config,
        executedAt: context.startTime,
        duration,
        output,
        scores: {
          accuracy: 0,
          completeness: 0,
          creativity: 0,
          efficiency: 0,
          overall: 0
        }
      };

      // 保存到数据库
      const savedExecution = this.executionDAO.create(execution);

      return savedExecution;

    } catch (error: any) {
      context.status = error.name === 'TimeoutError' 
        ? ExecutionStatus.TIMEOUT 
        : ExecutionStatus.FAILED;
      context.error = error.message;
      context.endTime = new Date();

      throw error;

    } finally {
      this.runningExecutions.delete(executionId);
    }
  }

  /**
   * 批量执行案例
   */
  async batchExecute(params: BatchExecutionParams): Promise<CaseExecution[]> {
    const results: CaseExecution[] = [];
    const errors: Array<{ caseId: string; tool: string; error: string }> = [];

    // 生成所有执行任务
    const tasks: ExecutionParams[] = [];
    for (const caseId of params.caseIds) {
      for (const tool of params.tools) {
        tasks.push({
          caseId,
          tool,
          config: params.config,
          timeout: params.timeout
        });
      }
    }

    // 并发执行控制
    const maxConcurrency = params.maxConcurrency || this.maxConcurrency;
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.executeCase(task)
        .then(result => {
          results.push(result);
        })
        .catch(error => {
          errors.push({
            caseId: task.caseId,
            tool: task.tool,
            error: error.message
          });
        });

      executing.push(promise);

      // 控制并发数
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    // 等待所有任务完成
    await Promise.all(executing);

    // 如果有错误，记录但不中断
    if (errors.length > 0) {
      console.warn('部分执行失败:', errors);
    }

    return results;
  }

  /**
   * 停止执行
   */
  async stopExecution(executionId: string): Promise<void> {
    const context = this.runningExecutions.get(executionId);
    if (!context) {
      throw new Error(`执行 ${executionId} 不存在或已完成`);
    }

    context.status = ExecutionStatus.CANCELLED;
    context.endTime = new Date();
    this.runningExecutions.delete(executionId);
  }

  /**
   * 获取运行中的执行列表
   */
  getRunningExecutions(): ExecutionContext[] {
    return Array.from(this.runningExecutions.values());
  }

  /**
   * 构建提示词
   */
  private buildPrompt(validationCase: ValidationCase): string {
    let prompt = '';

    // 添加背景
    if (validationCase.scenario.context) {
      prompt += `# 背景\n${validationCase.scenario.context}\n\n`;
    }

    // 添加任务
    prompt += `# 任务\n${validationCase.scenario.task}\n\n`;

    // 添加输入
    if (validationCase.scenario.input) {
      prompt += `# 输入\n${validationCase.scenario.input}\n\n`;
    }

    // 添加约束
    if (validationCase.scenario.constraints && validationCase.scenario.constraints.length > 0) {
      prompt += `# 约束条件\n`;
      validationCase.scenario.constraints.forEach(c => {
        prompt += `- ${c}\n`;
      });
      prompt += '\n';
    }

    // 添加期望类型提示
    switch (validationCase.expected.type) {
      case 'exact':
        prompt += `请提供精确的答案。\n`;
        break;
      case 'pattern':
        prompt += `请按照指定格式提供答案。\n`;
        break;
      case 'criteria':
        prompt += `请确保答案满足以下标准:\n`;
        if (validationCase.expected.criteria) {
          validationCase.expected.criteria.forEach(c => {
            prompt += `- ${c}\n`;
          });
        }
        break;
      case 'creative':
        prompt += `请发挥创意，提供创新的解决方案。\n`;
        break;
    }

    return prompt;
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => {
          const error = new Error('执行超时');
          error.name = 'TimeoutError';
          reject(error);
        }, timeout)
      )
    ]);
  }
}

/**
 * Mock工具适配器（用于测试）
 */
export class MockToolAdapter implements ToolAdapter {
  constructor(public name: string) {}

  async execute(input: string, config?: Record<string, any>): Promise<string> {
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    return `这是 ${this.name} 工具的模拟输出。\n\n输入长度: ${input.length} 字符\n配置: ${JSON.stringify(config || {})}`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * 通用工具适配器（基于现有adapters包）
 */
export class GenericToolAdapter implements ToolAdapter {
  constructor(
    public name: string,
    private executeFunc: (input: string, config?: Record<string, any>) => Promise<string>,
    private availableFunc?: () => Promise<boolean>
  ) {}

  async execute(input: string, config?: Record<string, any>): Promise<string> {
    return this.executeFunc(input, config);
  }

  async isAvailable(): Promise<boolean> {
    if (this.availableFunc) {
      return this.availableFunc();
    }
    return true;
  }
}
