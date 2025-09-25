/**
 * Meteor Shower Utils - 核心工具类库
 *
 * 提供项目核心功能模块：
 * - 模板引擎：模板渲染和变量替换
 * - 文件操作：安全文件读写和备份
 * - 配置生成：基于模板的配置生成
 * - 配置验证：配置正确性检查和验证
 */

// 导出模板引擎模块
export { TemplateEngine, type TemplateMetadata } from './template-engine.js';

// 导出文件操作模块
export { FileOperations, type FileOperation } from './file-ops.js';

// 导出配置生成模块
export { ConfigGenerator, type ConfigPlan } from './config-generator.js';

// 导出配置验证模块
export { ConfigValidator, type ValidationResult, type ValidationRule } from './config-validator.js';

// 导出错误处理模块
export {
  ErrorHandler,
  logger,
  LogLevel,
  ErrorType,
  ErrorSeverity,
  withErrorHandler,
  withPerformanceMonitor,
  type LogEntry,
  type ErrorEntry,
  type ErrorHandlerOptions
} from './error-handler.js';
