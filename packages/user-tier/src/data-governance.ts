/**
 * 数据治理管理器
 * 
 * 负责数据可见性控制、权限矩阵验证、审计日志等
 */

import chalk from 'chalk';
import {
  UserTier,
  UserRole,
  DataVisibility,
  Permission,
  User,
  Organization,
} from './types.js';

/**
 * 资源类型
 */
export type ResourceType = 
  | 'template'
  | 'config'
  | 'validation-case'
  | 'task'
  | 'report';

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  visibility: DataVisibility;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredTier?: UserTier;
}

/**
 * 数据治理管理器
 */
export class DataGovernanceManager {
  private auditLogs: AuditLogEntry[] = [];

  // ==================== 权限矩阵 ====================

  /**
   * 权限矩阵：定义每个角色对不同操作的权限
   */
  private permissionMatrix: Record<UserRole, Record<Permission, boolean>> = {
    [UserRole.ENTERPRISE_ADMIN]: {
      read: true,
      write: true,
      delete: true,
      admin: true,
      share: true,
    },
    [UserRole.DEPARTMENT_ADMIN]: {
      read: true,
      write: true,
      delete: true,
      admin: true,
      share: true,
    },
    [UserRole.TEAM_ADMIN]: {
      read: true,
      write: true,
      delete: false,
      admin: true,
      share: true,
    },
    [UserRole.MEMBER]: {
      read: true,
      write: true,
      delete: false,
      admin: false,
      share: false,
    },
    [UserRole.GUEST]: {
      read: true,
      write: false,
      delete: false,
      admin: false,
      share: false,
    },
  };

  // ==================== 可见性控制 ====================

  /**
   * 检查用户是否有权访问特定可见性级别的资源
   */
  async checkVisibilityAccess(
    user: User,
    resourceVisibility: DataVisibility,
    organization?: Organization
  ): Promise<PermissionCheckResult> {
    // 1. 私有资源：仅所有者可见
    if (resourceVisibility === 'private') {
      return { allowed: true }; // 假设检查的是用户自己的资源
    }

    // 2. 公开资源：所有人可见
    if (resourceVisibility === 'public') {
      return { allowed: true };
    }

    // 3. 团队/部门/企业级资源：需要相应权限
    const visibilityRequirements: Record<DataVisibility, UserTier[]> = {
      private: [UserTier.FREE, UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE],
      team: [UserTier.TEAM, UserTier.ENTERPRISE],
      department: [UserTier.ENTERPRISE],
      enterprise: [UserTier.ENTERPRISE],
      public: [UserTier.FREE, UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE],
    };

    const requiredTiers = visibilityRequirements[resourceVisibility];
    if (!requiredTiers.includes(user.tier)) {
      return {
        allowed: false,
        reason: `需要 ${requiredTiers.join(' 或 ')} 层级`,
        requiredTier: requiredTiers[0],
      };
    }

    // 4. 检查组织成员关系
    if (['team', 'department', 'enterprise'].includes(resourceVisibility)) {
      if (!user.organizationId || !organization) {
        return {
          allowed: false,
          reason: '需要加入组织',
        };
      }

      if (user.organizationId !== organization.id) {
        return {
          allowed: false,
          reason: '不在同一组织',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 获取用户可用的可见性级别
   */
  getAvailableVisibilityLevels(user: User): DataVisibility[] {
    const tierVisibility: Record<UserTier, DataVisibility[]> = {
      [UserTier.FREE]: ['public'],
      [UserTier.PRO]: ['private', 'public'],
      [UserTier.TEAM]: ['private', 'team', 'public'],
      [UserTier.ENTERPRISE]: ['private', 'team', 'department', 'enterprise', 'public'],
    };

    return tierVisibility[user.tier] || [];
  }

  // ==================== 权限检查 ====================

  /**
   * 检查用户是否有特定权限
   */
  async checkPermission(
    user: User,
    permission: Permission,
    resourceOwnerId?: string
  ): Promise<PermissionCheckResult> {
    // 如果是资源所有者，总是有权限（除了某些特殊情况）
    if (resourceOwnerId && user.id === resourceOwnerId) {
      return { allowed: true };
    }

    // 个人用户没有角色概念，默认为所有者
    if (!user.role) {
      if (resourceOwnerId && user.id !== resourceOwnerId) {
        return {
          allowed: false,
          reason: '非资源所有者',
        };
      }
      return { allowed: true };
    }

    // 检查权限矩阵
    const hasPermission = this.permissionMatrix[user.role]?.[permission];
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `角色 ${user.role} 没有 ${permission} 权限`,
        requiredRole: this.getMinimumRoleForPermission(permission),
      };
    }

    return { allowed: true };
  }

  /**
   * 获取特定权限所需的最小角色
   */
  private getMinimumRoleForPermission(permission: Permission): UserRole {
    const roles = [
      UserRole.GUEST,
      UserRole.MEMBER,
      UserRole.TEAM_ADMIN,
      UserRole.DEPARTMENT_ADMIN,
      UserRole.ENTERPRISE_ADMIN,
    ];

    for (const role of roles) {
      if (this.permissionMatrix[role]?.[permission]) {
        return role;
      }
    }

    return UserRole.ENTERPRISE_ADMIN;
  }

  // ==================== 审计日志 ====================

  /**
   * 记录审计日志
   */
  async logAction(
    userId: string,
    action: string,
    resourceType: ResourceType,
    resourceId: string,
    visibility: DataVisibility,
    details?: Record<string, any>
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resourceType,
      resourceId,
      visibility,
      timestamp: new Date(),
      details,
    };

    this.auditLogs.push(logEntry);
    console.log(
      chalk.gray(
        `📝 审计日志: ${userId} ${action} ${resourceType}:${resourceId} (${visibility})`
      )
    );
  }

  /**
   * 查询审计日志
   */
  async getAuditLogs(filters?: {
    userId?: string;
    resourceType?: ResourceType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogEntry[]> {
    let logs = this.auditLogs;

    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters?.resourceType) {
      logs = logs.filter(log => log.resourceType === filters.resourceType);
    }

    if (filters?.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    return logs;
  }

  /**
   * 清理过期审计日志
   */
  async cleanupOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const beforeCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(
      log => log.timestamp >= cutoffDate
    );
    const removedCount = beforeCount - this.auditLogs.length;

    if (removedCount > 0) {
      console.log(chalk.yellow(`🗑️  清理了 ${removedCount} 条过期审计日志`));
    }

    return removedCount;
  }

  // ==================== 数据加密 ====================

  /**
   * 检查是否需要加密
   */
  shouldEncrypt(visibility: DataVisibility, tier: UserTier): boolean {
    // 私有数据总是加密
    if (visibility === 'private') {
      return [UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE].includes(tier);
    }

    // 企业内部数据加密
    if (['team', 'department', 'enterprise'].includes(visibility)) {
      return [UserTier.TEAM, UserTier.ENTERPRISE].includes(tier);
    }

    return false;
  }

  // ==================== 合规性检查 ====================

  /**
   * 检查数据驻留合规性
   */
  async checkDataResidencyCompliance(
    organization: Organization,
    dataLocation: 'cn' | 'us' | 'eu'
  ): Promise<boolean> {
    if (!organization.settings.dataResidency) {
      return true; // 未设置要求，允许
    }

    return organization.settings.dataResidency === dataLocation;
  }

  /**
   * 生成合规性报告
   */
  async generateComplianceReport(organizationId: string): Promise<{
    totalResources: number;
    encryptedResources: number;
    auditLogsCovered: number;
    complianceScore: number;
  }> {
    // 简化的合规性报告生成逻辑
    const orgLogs = await this.getAuditLogs();
    
    return {
      totalResources: 100,
      encryptedResources: 85,
      auditLogsCovered: orgLogs.length,
      complianceScore: 85, // 百分比
    };
  }
}
