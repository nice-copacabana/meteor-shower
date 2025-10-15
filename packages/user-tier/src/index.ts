/**
 * meteor-shower User Tier & Pricing System
 * 
 * 用户分层与定价体系的主入口文件
 */

// 导出类型
export * from './types.js';

// 导出管理器
export { UserTierManager } from './tier-manager.js';
export { DataGovernanceManager } from './data-governance.js';
export type { 
  AuditLogEntry,
  ResourceType,
  PermissionCheckResult 
} from './data-governance.js';

// 导出数据库模块
export * from './database/index.js';

// 导出权限和审计模块
export * from './permissions/index.js';

// 导出配额管理模块
export * from './quota/quota-manager.js';
export * from './quota/usage-display.js';

// 导出功能开关模块
export * from './features/feature-flags.js';

// 导出升级引导模块
export * from './upgrade/upgrade-guide.js';

// 便捷实例
import { UserTierManager } from './tier-manager.js';
import { DataGovernanceManager } from './data-governance.js';

/**
 * 创建用户层级管理器实例
 */
export function createTierManager(): UserTierManager {
  return new UserTierManager();
}

/**
 * 创建数据治理管理器实例
 */
export function createDataGovernanceManager(): DataGovernanceManager {
  return new DataGovernanceManager();
}
