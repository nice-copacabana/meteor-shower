/**
 * 用户层级管理器
 * 
 * 负责用户层级判断、权限检查、配额验证等核心功能
 */

import chalk from 'chalk';
import {
  UserTier,
  UserRole,
  DataVisibility,
  Permission,
  User,
  Organization,
  TierLimits,
  TIER_LIMITS,
} from './types.js';

/**
 * 用户层级管理器
 */
export class UserTierManager {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  /**
   * 初始化默认数据（用于演示）
   */
  private initializeDefaults() {
    // 创建免费版示例用户
    const freeUser: User = {
      id: 'user-free-1',
      email: 'free@example.com',
      name: '免费用户',
      tier: UserTier.FREE,
      subscription: {
        status: 'active' as any,
        startDate: new Date(),
        endDate: new Date('2099-12-31'),
        autoRenew: false,
      },
      usage: {
        storageUsed: 0,
        validationRunsThisMonth: 0,
        activeTasks: 0,
        toolsConfigured: 0,
        cloudTemplates: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(freeUser.id, freeUser);

    console.log(chalk.gray('✅ 用户层级管理器初始化完成'));
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  /**
   * 创建用户
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || `user-${Date.now()}`,
      email: userData.email || '',
      name: userData.name || '新用户',
      tier: userData.tier || UserTier.FREE,
      subscription: userData.subscription || {
        status: 'active' as any,
        startDate: new Date(),
        endDate: new Date('2099-12-31'),
        autoRenew: false,
      },
      organizationId: userData.organizationId,
      role: userData.role,
      usage: userData.usage || {
        storageUsed: 0,
        validationRunsThisMonth: 0,
        activeTasks: 0,
        toolsConfigured: 0,
        cloudTemplates: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    console.log(chalk.green(`✅ 用户创建成功: ${user.name} (${user.tier})`));
    return user;
  }

  /**
   * 更新用户层级
   */
  async upgradeTier(userId: string, newTier: UserTier): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.tier = newTier;
    user.updatedAt = new Date();
    this.users.set(userId, user);

    console.log(chalk.blue(`⬆️  用户升级: ${user.name} → ${newTier}`));
    return true;
  }

  // ==================== 配额检查 ====================

  /**
   * 获取用户配额限制
   */
  getUserLimits(userId: string): TierLimits | null {
    const user = this.users.get(userId);
    if (!user) return null;

    return TIER_LIMITS[user.tier];
  }

  /**
   * 检查配额是否超限
   */
  async checkQuota(
    userId: string,
    quotaType: keyof TierLimits,
    currentValue: number
  ): Promise<{ allowed: boolean; limit: number; message?: string }> {
    const limits = this.getUserLimits(userId);
    if (!limits) {
      return { allowed: false, limit: 0, message: '用户不存在' };
    }

    const limit = limits[quotaType];
    
    // 处理 Infinity 和字符串类型的限制
    if (limit === Infinity || limit === 'Unlimited') {
      return { allowed: true, limit: Infinity };
    }

    const numericLimit = typeof limit === 'number' ? limit : parseInt(String(limit)) || 0;
    
    if (currentValue >= numericLimit) {
      return {
        allowed: false,
        limit: numericLimit,
        message: `已达到配额上限 (${numericLimit})`,
      };
    }

    return { allowed: true, limit: numericLimit };
  }

  /**
   * 检查是否可以添加工具
   */
  async canAddTool(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const result = await this.checkQuota(
      userId,
      'maxTools',
      user.usage.toolsConfigured
    );

    if (!result.allowed) {
      console.log(chalk.yellow(`⚠️  ${result.message}`));
    }

    return result.allowed;
  }

  /**
   * 检查是否可以创建模板
   */
  async canCreateTemplate(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const result = await this.checkQuota(
      userId,
      'maxCloudTemplates',
      user.usage.cloudTemplates
    );

    if (!result.allowed) {
      console.log(chalk.yellow(`⚠️  ${result.message}`));
    }

    return result.allowed;
  }

  // ==================== 权限检查 ====================

  /**
   * 检查数据可见性权限
   */
  async checkDataVisibility(
    userId: string,
    visibility: DataVisibility
  ): Promise<boolean> {
    const limits = this.getUserLimits(userId);
    if (!limits) return false;

    return limits.dataVisibility.includes(visibility);
  }

  /**
   * 检查功能权限
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // 功能-层级映射
    const featureRequirements: Record<string, UserTier[]> = {
      'private-templates': [UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE],
      'team-collaboration': [UserTier.TEAM, UserTier.ENTERPRISE],
      'sso': [UserTier.ENTERPRISE],
      'approval-workflow': [UserTier.TEAM, UserTier.ENTERPRISE],
      'audit-logs': [UserTier.TEAM, UserTier.ENTERPRISE],
      'advanced-analytics': [UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE],
    };

    const requiredTiers = featureRequirements[feature];
    if (!requiredTiers) return true; // 功能不受限制

    return requiredTiers.includes(user.tier);
  }

  // ==================== 组织管理 ====================

  /**
   * 获取组织信息
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    return this.organizations.get(orgId) || null;
  }

  /**
   * 检查组织席位
   */
  async checkOrganizationSeats(orgId: string): Promise<{
    available: boolean;
    total: number;
    used: number;
  }> {
    const org = this.organizations.get(orgId);
    if (!org) {
      return { available: false, total: 0, used: 0 };
    }

    return {
      available: org.seats.used < org.seats.total,
      total: org.seats.total,
      used: org.seats.used,
    };
  }

  // ==================== 使用量统计 ====================

  /**
   * 更新用户使用量
   */
  async updateUsage(
    userId: string,
    usageType: keyof User['usage'],
    increment: number
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.usage[usageType] = (user.usage[usageType] as number) + increment;
    user.updatedAt = new Date();
    this.users.set(userId, user);

    return true;
  }

  /**
   * 获取使用量百分比
   */
  async getUsagePercentage(
    userId: string,
    quotaType: keyof TierLimits
  ): Promise<number> {
    const user = this.users.get(userId);
    const limits = this.getUserLimits(userId);
    
    if (!user || !limits) return 0;

    const usageMap: Record<string, keyof User['usage']> = {
      maxTools: 'toolsConfigured',
      maxCloudTemplates: 'cloudTemplates',
      maxValidationRuns: 'validationRunsThisMonth',
      maxConcurrentTasks: 'activeTasks',
    };

    const usageKey = usageMap[quotaType];
    if (!usageKey) return 0;

    const currentUsage = user.usage[usageKey] as number;
    const limit = limits[quotaType];

    if (limit === Infinity || limit === 'Unlimited') return 0;

    const numericLimit = typeof limit === 'number' ? limit : parseInt(String(limit)) || 1;
    return (currentUsage / numericLimit) * 100;
  }

  // ==================== 层级比较 ====================

  /**
   * 比较两个层级的优先级
   */
  compareTiers(tier1: UserTier, tier2: UserTier): number {
    const tierOrder = [UserTier.FREE, UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE];
    return tierOrder.indexOf(tier1) - tierOrder.indexOf(tier2);
  }

  /**
   * 检查是否为高级层级
   */
  isPremiumTier(tier: UserTier): boolean {
    return [UserTier.PRO, UserTier.TEAM, UserTier.ENTERPRISE].includes(tier);
  }
}
