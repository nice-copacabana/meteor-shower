/**
 * 用户分层与定价系统
 * 
 * 实现 meteor-shower 的用户层级管理、权限控制、配额管理和数据治理
 */

// ==================== 用户层级定义 ====================

/**
 * 用户层级枚举
 */
export enum UserTier {
  FREE = 'free',              // 免费版
  PRO = 'pro',                // 个人专业版
  TEAM = 'team',              // 团队版
  ENTERPRISE = 'enterprise'   // 企业版
}

/**
 * 订阅状态
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',          // 激活
  CANCELLED = 'cancelled',    // 已取消
  EXPIRED = 'expired',        // 已过期
  TRIAL = 'trial'             // 试用期
}

// ==================== 配额限制 ====================

/**
 * 用户配额定义
 */
export interface TierLimits {
  maxTools: number;                    // 最多配置工具数
  maxCloudTemplates: number;           // 云端模板数量
  maxValidationRuns: number;           // 每月能力验证次数
  maxConcurrentTasks: number;          // 同时管理任务数
  storageQuota: string;                // 存储空间配额
  dataVisibility: DataVisibility[];    // 允许的数据可见性级别
  backupRetention?: number;            // 备份保留天数
  auditLogRetention?: number;          // 审计日志保留天数
  sla?: string;                        // SLA 保障
}

/**
 * 预定义的层级限制
 */
export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  [UserTier.FREE]: {
    maxTools: 3,
    maxCloudTemplates: 5,
    maxValidationRuns: 20,
    maxConcurrentTasks: 3,
    storageQuota: '100MB',
    dataVisibility: ['public'],
  },
  [UserTier.PRO]: {
    maxTools: Infinity,
    maxCloudTemplates: Infinity,
    maxValidationRuns: 500,
    maxConcurrentTasks: 20,
    storageQuota: '10GB',
    dataVisibility: ['private', 'public'],
    backupRetention: 7,
  },
  [UserTier.TEAM]: {
    maxTools: Infinity,
    maxCloudTemplates: Infinity,
    maxValidationRuns: 2000,
    maxConcurrentTasks: 100,
    storageQuota: '100GB',
    dataVisibility: ['private', 'team', 'public'],
    backupRetention: 30,
    auditLogRetention: 90,
  },
  [UserTier.ENTERPRISE]: {
    maxTools: Infinity,
    maxCloudTemplates: Infinity,
    maxValidationRuns: Infinity,
    maxConcurrentTasks: Infinity,
    storageQuota: 'Unlimited',
    dataVisibility: ['private', 'team', 'department', 'enterprise', 'public'],
    backupRetention: Infinity,
    auditLogRetention: 365,
    sla: '99.9%',
  },
};

// ==================== 数据治理 ====================

/**
 * 数据可见性级别
 */
export type DataVisibility = 
  | 'private'      // 私有
  | 'team'         // 团队内
  | 'department'   // 部门内
  | 'enterprise'   // 企业内
  | 'public';      // 公开

/**
 * 用户角色
 */
export enum UserRole {
  ENTERPRISE_ADMIN = 'enterprise_admin',  // 企业超级管理员
  DEPARTMENT_ADMIN = 'department_admin',  // 部门管理员
  TEAM_ADMIN = 'team_admin',              // 团队管理员
  MEMBER = 'member',                      // 普通成员
  GUEST = 'guest'                         // 访客
}

/**
 * 权限动作
 */
export type Permission = 
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'
  | 'share';

// ==================== 用户和组织 ====================

/**
 * 用户信息
 */
export interface User {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  subscription: {
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  organizationId?: string;
  role?: UserRole;
  usage: {
    storageUsed: number;              // 已使用存储（字节）
    validationRunsThisMonth: number;  // 本月验证次数
    activeTasks: number;              // 活跃任务数
    toolsConfigured: number;          // 已配置工具数
    cloudTemplates: number;           // 云端模板数
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 组织信息
 */
export interface Organization {
  id: string;
  name: string;
  tier: UserTier.TEAM | UserTier.ENTERPRISE;
  seats: {
    total: number;
    used: number;
  };
  subscription: {
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  departments?: Department[];
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 部门信息（仅企业版）
 */
export interface Department {
  id: string;
  name: string;
  organizationId: string;
  adminIds: string[];
  memberIds: string[];
}

/**
 * 组织设置
 */
export interface OrganizationSettings {
  allowPublicTemplates: boolean;
  requireApproval: boolean;
  ssoEnabled: boolean;
  ipWhitelist?: string[];
  dataResidency?: 'cn' | 'us' | 'eu';
}

// ==================== 定价方案 ====================

/**
 * 定价方案
 */
export interface PricingPlan {
  tier: UserTier;
  monthly: number;    // 月付价格（分）
  yearly: number;     // 年付价格（分）
  minSeats?: number;  // 最少席位
  maxSeats?: number;  // 最多席位
}

/**
 * 预定义定价方案
 */
export const PRICING_PLANS: Record<UserTier, PricingPlan> = {
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    monthly: 0,
    yearly: 0,
  },
  [UserTier.PRO]: {
    tier: UserTier.PRO,
    monthly: 9900,      // ¥99
    yearly: 99900,      // ¥999 (节省17%)
  },
  [UserTier.TEAM]: {
    tier: UserTier.TEAM,
    monthly: 29900,     // ¥299/用户
    yearly: 299900,     // ¥2,999/用户 (节省17%)
    minSeats: 3,
    maxSeats: 50,
  },
  [UserTier.ENTERPRISE]: {
    tier: UserTier.ENTERPRISE,
    monthly: 0,         // 联系销售
    yearly: 0,
    minSeats: 50,
  },
};

// ==================== 导出所有类型 ====================
