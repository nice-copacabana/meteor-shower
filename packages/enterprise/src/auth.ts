import chalk from 'chalk';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

export interface Organization {
  id: string;
  name: string;
  members: User[];
  settings: {
    allowPublicTemplates: boolean;
    requireApproval: boolean;
    maxTemplatesPerUser: number;
  };
}

export class AuthManager {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // 创建默认管理员
    const admin: User = {
      id: 'admin-1',
      name: '系统管理员',
      email: 'admin@meteor-shower.com',
      role: 'admin',
      permissions: ['*']
    };
    this.users.set(admin.id, admin);

    // 创建默认组织
    const org: Organization = {
      id: 'org-1',
      name: 'meteor-shower 企业',
      members: [admin],
      settings: {
        allowPublicTemplates: true,
        requireApproval: false,
        maxTemplatesPerUser: 10
      }
    };
    this.organizations.set(org.id, org);
  }

  async authenticate(token: string): Promise<User | null> {
    // 简单的 token 验证（生产环境应使用 JWT）
    if (token === 'admin-token') {
      return this.users.get('admin-1') || null;
    }
    return null;
  }

  async checkPermission(user: User, action: string, resource?: string): Promise<boolean> {
    if (user.permissions.includes('*')) {
      return true;
    }

    const permissionMap: Record<string, string[]> = {
      'template:create': ['template:write'],
      'template:read': ['template:read'],
      'template:update': ['template:write'],
      'template:delete': ['template:write'],
      'user:manage': ['user:admin'],
      'org:manage': ['org:admin']
    };

    const requiredPermissions = permissionMap[action] || [];
    return requiredPermissions.some(perm => user.permissions.includes(perm));
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      name: userData.name || '新用户',
      email: userData.email || '',
      role: userData.role || 'user',
      permissions: userData.permissions || ['template:read']
    };

    this.users.set(user.id, user);
    console.log(chalk.green(`✅ 用户创建成功: ${user.name} (${user.email})`));
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    console.log(chalk.yellow(`🔄 用户更新成功: ${updatedUser.name}`));
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    return this.organizations.get(orgId) || null;
  }

  async updateOrganizationSettings(orgId: string, settings: Partial<Organization['settings']>): Promise<boolean> {
    const org = this.organizations.get(orgId);
    if (!org) return false;

    org.settings = { ...org.settings, ...settings };
    this.organizations.set(orgId, org);
    console.log(chalk.blue(`⚙️  组织设置更新: ${org.name}`));
    return true;
  }
}
