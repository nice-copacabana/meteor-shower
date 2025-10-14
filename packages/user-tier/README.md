# meteor-shower 用户分层与定价系统

> 提供完整的用户层级管理、权限控制、配额管理和数据治理功能

## 📦 功能特性

- **四层用户体系**: 免费版 → 个人专业版 → 团队版 → 企业版
- **灵活的配额管理**: 工具数量、模板数、存储空间、验证次数等多维度限制
- **多级数据治理**: 私有/团队/部门/企业/公开五级可见性控制
- **权限矩阵系统**: 细粒度的角色-权限映射
- **审计日志**: 完整的操作追踪和合规性报告
- **订阅管理**: 月付/年付、自动续费、席位管理

## 🚀 快速开始

### 安装

```bash
npm install meteor-shower-user-tier
```

### 基本使用

```typescript
import { 
  createTierManager,
  createDataGovernanceManager,
  UserTier 
} from 'meteor-shower-user-tier';

// 创建管理器实例
const tierManager = createTierManager();
const governanceManager = createDataGovernanceManager();

// 创建用户
const user = await tierManager.createUser({
  email: 'user@example.com',
  name: '张三',
  tier: UserTier.PRO
});

// 检查配额
const canAddTool = await tierManager.canAddTool(user.id);
if (canAddTool) {
  console.log('可以添加工具');
}

// 检查权限
const result = await governanceManager.checkPermission(user, 'write');
console.log('是否有写权限:', result.allowed);
```

## 📚 核心 API

### UserTierManager

用户层级管理器，负责用户创建、层级升级、配额检查等。

#### 用户管理

```typescript
// 获取用户
const user = await tierManager.getUser(userId);

// 创建用户
const newUser = await tierManager.createUser({
  email: 'user@example.com',
  tier: UserTier.FREE
});

// 升级用户层级
await tierManager.upgradeTier(userId, UserTier.PRO);
```

#### 配额检查

```typescript
// 检查是否可以添加工具
const canAdd = await tierManager.canAddTool(userId);

// 检查是否可以创建模板
const canCreate = await tierManager.canCreateTemplate(userId);

// 检查通用配额
const result = await tierManager.checkQuota(
  userId,
  'maxValidationRuns',
  currentCount
);

// 获取使用量百分比
const percentage = await tierManager.getUsagePercentage(
  userId,
  'maxCloudTemplates'
);
```

#### 功能权限

```typescript
// 检查功能访问权限
const hasAccess = await tierManager.checkFeatureAccess(userId, 'sso');

// 检查数据可见性权限
const canUse = await tierManager.checkDataVisibility(userId, 'team');
```

### DataGovernanceManager

数据治理管理器，负责可见性控制、权限验证、审计日志等。

#### 可见性控制

```typescript
// 检查可见性访问权限
const result = await governanceManager.checkVisibilityAccess(
  user,
  'team',
  organization
);

// 获取可用的可见性级别
const levels = governanceManager.getAvailableVisibilityLevels(user);
console.log('可用级别:', levels); // ['private', 'team', 'public']
```

#### 权限检查

```typescript
// 检查特定权限
const result = await governanceManager.checkPermission(
  user,
  'delete',
  resourceOwnerId
);

if (!result.allowed) {
  console.log('拒绝原因:', result.reason);
  console.log('所需角色:', result.requiredRole);
}
```

#### 审计日志

```typescript
// 记录操作
await governanceManager.logAction(
  userId,
  'create',
  'template',
  templateId,
  'team'
);

// 查询日志
const logs = await governanceManager.getAuditLogs({
  userId: 'user-123',
  startDate: new Date('2025-01-01'),
  resourceType: 'template'
});

// 清理过期日志
const removed = await governanceManager.cleanupOldLogs(90); // 保留90天
```

## 🎯 用户层级详解

### 免费版 (Free)

**目标用户**: 个人开发者、试用用户

**功能限制**:
- 最多 3 个工具配置
- 云端 5 个模板
- 每月 20 次能力验证
- 同时 3 个任务
- 100MB 存储空间
- 仅支持公开数据

**定价**: ¥0

### 个人专业版 (Pro)

**目标用户**: 专业开发者

**功能增强**:
- 无限工具配置
- 无限云端模板
- 每月 500 次能力验证
- 同时 20 个任务
- 10GB 存储空间
- 支持私有数据
- 7天备份保留
- AI 增强功能

**定价**: ¥99/月 或 ¥999/年

### 团队版 (Team)

**目标用户**: 3-50人团队

**功能增强**:
- 所有专业版功能
- 团队协作功能
- 团队权限管理
- 每月 2000 次验证（团队共享）
- 100GB 存储（团队共享）
- 30天备份保留
- 90天审计日志
- 简化版审批流

**定价**: ¥299/用户/月 或 ¥2,999/用户/年（3-50席位）

### 企业版 (Enterprise)

**目标用户**: 50人以上企业

**功能增强**:
- 所有团队版功能
- SSO 单点登录
- 完整审批流程
- 无限配额
- 365天审计日志
- 多部门管理
- 99.9% SLA
- 私有化部署
- 7×24 技术支持

**定价**: 联系销售（50+席位）

## 🔐 数据治理

### 五级可见性

1. **private (私有)**: 仅创建者可见
2. **team (团队)**: 团队成员可见
3. **department (部门)**: 部门成员可见（仅企业版）
4. **enterprise (企业)**: 企业成员可见（仅企业版）
5. **public (公开)**: 所有人可见

### 权限矩阵

| 角色 | 读取 | 写入 | 删除 | 管理 | 分享 |
|------|------|------|------|------|------|
| 企业管理员 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 部门管理员 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 团队管理员 | ✅ | ✅ | ❌ | ✅ | ✅ |
| 成员 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 访客 | ✅ | ❌ | ❌ | ❌ | ❌ |

## 💡 使用示例

### 完整工作流

```typescript
import {
  createTierManager,
  createDataGovernanceManager,
  UserTier,
  UserRole
} from 'meteor-shower-user-tier';

const tierManager = createTierManager();
const governance = createDataGovernanceManager();

// 1. 创建用户
const user = await tierManager.createUser({
  email: 'dev@company.com',
  name: '开发者',
  tier: UserTier.TEAM,
  role: UserRole.TEAM_ADMIN
});

// 2. 检查配额
if (await tierManager.canCreateTemplate(user.id)) {
  // 3. 检查权限
  const permCheck = await governance.checkPermission(user, 'write');
  
  if (permCheck.allowed) {
    // 4. 创建资源
    const templateId = 'template-123';
    
    // 5. 记录审计日志
    await governance.logAction(
      user.id,
      'create',
      'template',
      templateId,
      'team',
      { name: 'My Template' }
    );
    
    // 6. 更新使用量
    await tierManager.updateUsage(user.id, 'cloudTemplates', 1);
    
    console.log('✅ 模板创建成功');
  }
}

// 7. 查看使用量
const usage = await tierManager.getUsagePercentage(
  user.id,
  'maxCloudTemplates'
);
console.log(`模板使用率: ${usage}%`);
```

### 组织管理

```typescript
// 检查组织席位
const seats = await tierManager.checkOrganizationSeats(orgId);
if (seats.available) {
  console.log(`可用席位: ${seats.total - seats.used}`);
}

// 获取组织信息
const org = await tierManager.getOrganization(orgId);
console.log('组织名称:', org?.name);
console.log('组织层级:', org?.tier);
```

## 📊 配额和限制

```typescript
import { TIER_LIMITS, UserTier } from 'meteor-shower-user-tier';

// 查看各层级限制
console.log('免费版限制:', TIER_LIMITS[UserTier.FREE]);
console.log('专业版限制:', TIER_LIMITS[UserTier.PRO]);
console.log('团队版限制:', TIER_LIMITS[UserTier.TEAM]);
console.log('企业版限制:', TIER_LIMITS[UserTier.ENTERPRISE]);
```

## 🔄 升级流程

```typescript
// 检查当前层级
const user = await tierManager.getUser(userId);
console.log('当前层级:', user.tier);

// 升级到更高层级
if (tierManager.compareTiers(user.tier, UserTier.PRO) < 0) {
  await tierManager.upgradeTier(userId, UserTier.PRO);
  console.log('已升级到专业版');
}

// 检查是否为高级层级
if (tierManager.isPremiumTier(user.tier)) {
  console.log('这是付费用户');
}
```

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式
npm run dev

# 测试
npm test
```

## 📖 相关文档

- [完整设计文档](../../USER_TIER_AND_PRICING_DESIGN.md)
- [项目主页](../../README.md)

## 📝 许可证

MIT License
