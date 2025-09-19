import chalk from 'chalk';
export class AuthManager {
    constructor() {
        this.users = new Map();
        this.organizations = new Map();
        this.initializeDefaultData();
    }
    initializeDefaultData() {
        // 创建默认管理员
        const admin = {
            id: 'admin-1',
            name: '系统管理员',
            email: 'admin@meteor-shower.com',
            role: 'admin',
            permissions: ['*']
        };
        this.users.set(admin.id, admin);
        // 创建默认组织
        const org = {
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
    async authenticate(token) {
        // 简单的 token 验证（生产环境应使用 JWT）
        if (token === 'admin-token') {
            return this.users.get('admin-1') || null;
        }
        return null;
    }
    async checkPermission(user, action, resource) {
        if (user.permissions.includes('*')) {
            return true;
        }
        const permissionMap = {
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
    async createUser(userData) {
        const user = {
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
    async updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        const updatedUser = { ...user, ...updates };
        this.users.set(userId, updatedUser);
        console.log(chalk.yellow(`🔄 用户更新成功: ${updatedUser.name}`));
        return updatedUser;
    }
    async listUsers() {
        return Array.from(this.users.values());
    }
    async getOrganization(orgId) {
        return this.organizations.get(orgId) || null;
    }
    async updateOrganizationSettings(orgId, settings) {
        const org = this.organizations.get(orgId);
        if (!org)
            return false;
        org.settings = { ...org.settings, ...settings };
        this.organizations.set(orgId, org);
        console.log(chalk.blue(`⚙️  组织设置更新: ${org.name}`));
        return true;
    }
}
