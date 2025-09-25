/**
 * Meteor Shower Utils - 核心工具类库
 *
 * 提供项目核心功能模块：
 * - 模板引擎：模板渲染和变量替换
 * - 文件操作：安全文件读写和备份
 * - 配置生成：基于模板的配置生成
 */

// 导出模板引擎模块
export { TemplateEngine, type TemplateMetadata } from './template-engine.js';

// 导出文件操作模块
export { FileOperations, type FileOperation } from './file-ops.js';

// 导出配置生成模块
export { ConfigGenerator, type ConfigPlan } from './config-generator.js';
