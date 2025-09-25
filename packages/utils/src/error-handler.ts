/**
 * 错误处理和日志记录模块
 * 提供统一的错误处理、日志记录和调试功能
 *
 * 核心功能：
 * - 结构化错误处理
 * - 多级别日志记录
 * - 错误恢复机制
 * - 调试信息收集
 * - 性能监控
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 错误类型
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  FILE_SYSTEM = 'FILE_SYSTEM',
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 日志条目接口
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category?: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

// 错误条目接口
export interface ErrorEntry {
  id: string;
  timestamp: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  resolved?: boolean;
  resolution?: string;
}

// 错误处理选项
export interface ErrorHandlerOptions {
  logLevel?: LogLevel;
  logFile?: string;
  enableConsoleOutput?: boolean;
  enableFileOutput?: boolean;
  maxLogFiles?: number;
  maxLogFileSize?: number; // bytes
  errorRecovery?: boolean;
  debugMode?: boolean;
}

/**
 * 统一的错误处理和日志记录器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private options: Required<ErrorHandlerOptions>;
  private logQueue: LogEntry[] = [];
  private errorQueue: ErrorEntry[] = [];
  private isProcessing = false;

  private constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logLevel: LogLevel.INFO,
      logFile: path.join(os.homedir(), '.meteor-shower', 'logs', 'app.log'),
      enableConsoleOutput: true,
      enableFileOutput: true,
      maxLogFiles: 10,
      maxLogFileSize: 10 * 1024 * 1024, // 10MB
      errorRecovery: true,
      debugMode: false,
      ...options
    };

    this.initializeLogging();
    this.startLogProcessing();
  }

  /**
   * 获取单例实例
   */
  static getInstance(options?: ErrorHandlerOptions): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(options);
    }
    return ErrorHandler.instance;
  }

  /**
   * 初始化日志系统
   */
  private async initializeLogging() {
    try {
      if (this.options.enableFileOutput) {
        const logDir = path.dirname(this.options.logFile);
        await fs.mkdir(logDir, { recursive: true });

        // 清理旧的日志文件
        await this.cleanupOldLogs();
      }
    } catch (error) {
      console.error(chalk.red('❌ 日志系统初始化失败:'), error);
    }
  }

  /**
   * 清理旧的日志文件
   */
  private async cleanupOldLogs() {
    try {
      const logDir = path.dirname(this.options.logFile);
      const logBaseName = path.basename(this.options.logFile, '.log');

      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter(file => file.startsWith(logBaseName) && (file.endsWith('.log') || file.endsWith('.log.1')))
        .sort()
        .reverse();

      // 删除超过限制的文件
      if (logFiles.length > this.options.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.options.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(logDir, file));
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️ 日志文件清理失败:'), error);
    }
  }

  /**
   * 启动日志处理循环
   */
  private startLogProcessing() {
    setInterval(async () => {
      if (!this.isProcessing && (this.logQueue.length > 0 || this.errorQueue.length > 0)) {
        await this.processQueues();
      }
    }, 1000);

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      this.handleError({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.CRITICAL,
        message: '未捕获的异常',
        stack: error.stack,
        context: { error: error.message }
      });
    });

    process.on('unhandledRejection', (reason) => {
      this.handleError({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.HIGH,
        message: '未处理的Promise拒绝',
        context: { reason: reason }
      });
    });
  }

  /**
   * 处理日志和错误队列
   */
  private async processQueues() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // 处理日志队列
      if (this.logQueue.length > 0) {
        const logs = [...this.logQueue];
        this.logQueue = [];

        await this.writeLogs(logs);
      }

      // 处理错误队列
      if (this.errorQueue.length > 0) {
        const errors = [...this.errorQueue];
        this.errorQueue = [];

        await this.writeErrors(errors);
      }
    } catch (error) {
      console.error(chalk.red('❌ 队列处理失败:'), error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 写入日志
   */
  private async writeLogs(logs: LogEntry[]) {
    if (!this.options.enableFileOutput) return;

    try {
      const logContent = logs.map(log =>
        JSON.stringify(log, null, 2)
      ).join('\n') + '\n';

      await fs.appendFile(this.options.logFile, logContent);

      // 检查文件大小
      const stats = await fs.stat(this.options.logFile);
      if (stats.size > this.options.maxLogFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      console.error(chalk.red('❌ 写入日志失败:'), error);
    }
  }

  /**
   * 写入错误记录
   */
  private async writeErrors(errors: ErrorEntry[]) {
    if (!this.options.enableFileOutput) return;

    try {
      const errorLogFile = this.options.logFile.replace('.log', '.error.log');
      const errorContent = errors.map(error =>
        JSON.stringify(error, null, 2)
      ).join('\n') + '\n';

      await fs.appendFile(errorLogFile, errorContent);
    } catch (error) {
      console.error(chalk.red('❌ 写入错误日志失败:'), error);
    }
  }

  /**
   * 轮转日志文件
   */
  private async rotateLogFile() {
    try {
      const logDir = path.dirname(this.options.logFile);
      const logBaseName = path.basename(this.options.logFile, '.log');

      // 删除最旧的日志文件
      const oldLogFile = path.join(logDir, `${logBaseName}.log.9`);
      try {
        await fs.unlink(oldLogFile);
      } catch {
        // 文件不存在，忽略
      }

      // 轮转现有文件
      for (let i = 8; i >= 0; i--) {
        const currentFile = path.join(logDir, `${logBaseName}.log${i === 0 ? '' : '.' + i}`);
        const nextFile = path.join(logDir, `${logBaseName}.log.${i + 1}`);

        try {
          await fs.rename(currentFile, nextFile);
        } catch {
          // 文件不存在，继续
        }
      }

      // 创建新的日志文件
      await fs.writeFile(this.options.logFile, '');
    } catch (error) {
      console.error(chalk.red('❌ 日志轮转失败:'), error);
    }
  }

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, category?: string, context?: Record<string, any>) {
    if (level < this.options.logLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category: category || 'GENERAL',
      context: context || {}
    };

    if (level >= LogLevel.ERROR && context?.error instanceof Error) {
      logEntry.stack = context.error.stack;
    }

    this.logQueue.push(logEntry);

    // 控制台输出
    if (this.options.enableConsoleOutput) {
      this.consoleOutput(logEntry);
    }
  }

  /**
   * 控制台输出
   */
  private consoleOutput(logEntry: LogEntry) {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const levelStr = LogLevel[logEntry.level].padEnd(5);
    const category = logEntry.category?.padEnd(10) || 'GENERAL  ';

    let formattedMessage = `[${timestamp}] ${levelStr} ${category} ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.log(chalk.gray(formattedMessage));
        break;
      case LogLevel.INFO:
        console.log(chalk.blue(formattedMessage));
        break;
      case LogLevel.WARN:
        console.log(chalk.yellow(formattedMessage));
        break;
      case LogLevel.ERROR:
        console.error(chalk.red(formattedMessage));
        if (logEntry.stack) {
          console.error(chalk.red(logEntry.stack));
        }
        break;
      case LogLevel.FATAL:
        console.error(chalk.red.bold(`💀 ${formattedMessage}`));
        if (logEntry.stack) {
          console.error(chalk.red(logEntry.stack));
        }
        break;
    }
  }

  /**
   * 处理错误
   */
  handleError(error: Partial<ErrorEntry> & { message: string }) {
    const errorEntry: ErrorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: error.type || ErrorType.UNKNOWN,
      severity: error.severity || ErrorSeverity.MEDIUM,
      message: error.message,
      stack: error.stack,
      context: error.context || {},
      resolved: false
    };

    this.errorQueue.push(errorEntry);
    this.log(LogLevel.ERROR, error.message, 'ERROR_HANDLER', {
      errorId: errorEntry.id,
      type: error.type,
      severity: error.severity
    });

    // 错误恢复
    if (this.options.errorRecovery) {
      this.attemptErrorRecovery(errorEntry);
    }

    return errorEntry.id;
  }

  /**
   * 尝试错误恢复
   */
  private attemptErrorRecovery(error: ErrorEntry) {
    // 根据错误类型尝试恢复
    switch (error.type) {
      case ErrorType.FILE_SYSTEM:
        this.log(LogLevel.INFO, '尝试文件系统错误恢复', 'RECOVERY');
        // 可以实现文件备份恢复等逻辑
        break;

      case ErrorType.NETWORK:
        this.log(LogLevel.INFO, '网络连接可能不稳定，稍后重试', 'RECOVERY');
        break;

      case ErrorType.CONFIGURATION:
        this.log(LogLevel.INFO, '检查配置文件完整性', 'RECOVERY');
        break;
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.options.debugMode) {
      this.log(LogLevel.DEBUG, message, 'DEBUG', context);
    }
  }

  /**
   * 记录信息
   */
  info(message: string, category?: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, category, context);
  }

  /**
   * 记录警告
   */
  warn(message: string, category?: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, category, context);
  }

  /**
   * 记录错误
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, 'ERROR', {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * 记录致命错误
   */
  fatal(message: string, error?: Error) {
    this.log(LogLevel.FATAL, message, 'FATAL', {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });

    // 致命错误后退出
    setTimeout(() => process.exit(1), 100);
  }

  /**
   * 获取日志统计
   */
  async getLogStats(): Promise<{
    totalLogs: number;
    errors: number;
    warnings: number;
    byCategory: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    // 这里可以从日志文件读取统计信息
    // 为了简化，返回队列中的统计
    const byCategory: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    [...this.logQueue, ...this.errorQueue.map(e => ({ level: LogLevel.ERROR, category: 'ERROR' }))]
      .forEach(entry => {
        const category = entry.category || 'UNKNOWN';
        const level = LogLevel[entry.level] || 'UNKNOWN';

        byCategory[category] = (byCategory[category] || 0) + 1;
        byLevel[level] = (byLevel[level] || 0) + 1;
      });

    return {
      totalLogs: this.logQueue.length,
      errors: this.errorQueue.length,
      warnings: this.logQueue.filter(l => l.level === LogLevel.WARN).length,
      byCategory,
      byLevel
    };
  }

  /**
   * 导出日志
   */
  async exportLogs(since?: Date): Promise<string> {
    // 这里可以从文件系统读取完整的日志
    // 为了简化，返回当前队列的日志
    const logsToExport = since
      ? this.logQueue.filter(log => new Date(log.timestamp) >= since)
      : this.logQueue;

    return logsToExport.map(log => JSON.stringify(log, null, 2)).join('\n');
  }

  /**
   * 清除日志
   */
  async clearLogs() {
    this.logQueue = [];
    this.errorQueue = [];

    if (this.options.enableFileOutput) {
      try {
        await fs.writeFile(this.options.logFile, '');
        const errorLogFile = this.options.logFile.replace('.log', '.error.log');
        await fs.writeFile(errorLogFile, '');
      } catch (error) {
        console.error(chalk.red('❌ 清除日志失败:'), error);
      }
    }

    this.info('日志已清除', 'MAINTENANCE');
  }
}

// 便捷函数
export const logger = ErrorHandler.getInstance();

/**
 * 装饰器：自动错误处理
 */
export function withErrorHandler(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    try {
      return await method.apply(this, args);
    } catch (error) {
      logger.error(`${propertyName} 执行失败`, error);
      throw error;
    }
  };
}

/**
 * 装饰器：性能监控
 */
export function withPerformanceMonitor(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const startTime = Date.now();
    logger.debug(`开始执行 ${propertyName}`, { args: args.length });

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;

      logger.debug(`完成执行 ${propertyName}`, {
        duration: `${duration}ms`,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`${propertyName} 执行失败`, error, {
        duration: `${duration}ms`
      });

      throw error;
    }
  };
}