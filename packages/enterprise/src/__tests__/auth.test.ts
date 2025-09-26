import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthManager, User, Organization } from '../auth.js';

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text
  }
}));

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager();
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default admin user', async () => {
      const users = await authManager.listUsers();
      
      expect(users).toHaveLength(1);
      expect(users[0].role).toBe('admin');
      expect(users[0].email).toBe('admin@meteor-shower.com');
      expect(users[0].permissions).toContain('*');
    });

    it('should initialize with default organization', async () => {
      const org = await authManager.getOrganization('org-1');
      
      expect(org).toBeDefined();
      expect(org?.name).toBe('meteor-shower 企业');
      expect(org?.members).toHaveLength(1);
      expect(org?.settings.allowPublicTemplates).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('should authenticate admin user with valid token', async () => {
      const user = await authManager.authenticate('admin-token');
      
      expect(user).toBeDefined();
      expect(user?.role).toBe('admin');
      expect(user?.email).toBe('admin@meteor-shower.com');
    });

    it('should return null for invalid token', async () => {
      const user = await authManager.authenticate('invalid-token');
      
      expect(user).toBeNull();
    });

    it('should return null for empty token', async () => {
      const user = await authManager.authenticate('');
      
      expect(user).toBeNull();
    });
  });

  describe('checkPermission', () => {
    let adminUser: User;
    let regularUser: User;

    beforeEach(async () => {
      adminUser = (await authManager.authenticate('admin-token'))!;
      regularUser = await authManager.createUser({
        name: 'Regular User',
        email: 'user@test.com',
        role: 'user',
        permissions: ['template:read', 'template:write']
      });
    });

    it('should allow admin user all permissions', async () => {
      const canCreate = await authManager.checkPermission(adminUser, 'template:create');
      const canManageUsers = await authManager.checkPermission(adminUser, 'user:manage');
      const canManageOrg = await authManager.checkPermission(adminUser, 'org:manage');
      
      expect(canCreate).toBe(true);
      expect(canManageUsers).toBe(true);
      expect(canManageOrg).toBe(true);
    });

    it('should restrict regular user permissions', async () => {
      const canCreate = await authManager.checkPermission(regularUser, 'template:create');
      const canRead = await authManager.checkPermission(regularUser, 'template:read');
      const canManageUsers = await authManager.checkPermission(regularUser, 'user:manage');
      
      expect(canCreate).toBe(true); // Has template:write permission
      expect(canRead).toBe(true); // Has template:read permission
      expect(canManageUsers).toBe(false); // Lacks user:admin permission
    });

    it('should handle unknown permissions', async () => {
      const canDoUnknown = await authManager.checkPermission(regularUser, 'unknown:action');
      
      expect(canDoUnknown).toBe(false);
    });

    it('should handle user with minimal permissions', async () => {
      const viewerUser = await authManager.createUser({
        name: 'Viewer',
        email: 'viewer@test.com',
        role: 'viewer',
        permissions: ['template:read']
      });

      const canRead = await authManager.checkPermission(viewerUser, 'template:read');
      const canCreate = await authManager.checkPermission(viewerUser, 'template:create');
      
      expect(canRead).toBe(true);
      expect(canCreate).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create user with provided data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        permissions: ['template:read', 'template:write']
      };

      const user = await authManager.createUser(userData);
      
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.permissions).toEqual(['template:read', 'template:write']);
      expect(user.id).toMatch(/^user-\d+$/);
    });

    it('should create user with default values for missing fields', async () => {
      const user = await authManager.createUser({});
      
      expect(user.name).toBe('新用户');
      expect(user.email).toBe('');
      expect(user.role).toBe('user');
      expect(user.permissions).toEqual(['template:read']);
    });

    it('should generate unique IDs for different users', async () => {
      const user1 = await authManager.createUser({ name: 'User 1' });
      const user2 = await authManager.createUser({ name: 'User 2' });
      
      expect(user1.id).not.toBe(user2.id);
    });

    it('should add created user to users list', async () => {
      const initialUsers = await authManager.listUsers();
      const initialCount = initialUsers.length;

      await authManager.createUser({ name: 'New User' });
      
      const updatedUsers = await authManager.listUsers();
      expect(updatedUsers).toHaveLength(initialCount + 1);
    });
  });

  describe('updateUser', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await authManager.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      });
    });

    it('should update existing user', async () => {
      const updates = {
        name: 'Updated User',
        email: 'updated@example.com',
        role: 'admin' as const
      };

      const updatedUser = await authManager.updateUser(testUser.id, updates);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated User');
      expect(updatedUser?.email).toBe('updated@example.com');
      expect(updatedUser?.role).toBe('admin');
    });

    it('should return null for non-existent user', async () => {
      const result = await authManager.updateUser('non-existent-id', { name: 'Test' });
      
      expect(result).toBeNull();
    });

    it('should preserve unchanged fields', async () => {
      const originalEmail = testUser.email;
      const originalRole = testUser.role;

      const updatedUser = await authManager.updateUser(testUser.id, {
        name: 'New Name'
      });
      
      expect(updatedUser?.name).toBe('New Name');
      expect(updatedUser?.email).toBe(originalEmail);
      expect(updatedUser?.role).toBe(originalRole);
    });

    it('should update permissions array', async () => {
      const newPermissions = ['template:read', 'template:write', 'user:admin'];
      
      const updatedUser = await authManager.updateUser(testUser.id, {
        permissions: newPermissions
      });
      
      expect(updatedUser?.permissions).toEqual(newPermissions);
    });
  });

  describe('listUsers', () => {
    it('should return all users', async () => {
      const initialUsers = await authManager.listUsers();
      const initialCount = initialUsers.length;

      await authManager.createUser({ name: 'User 1' });
      await authManager.createUser({ name: 'User 2' });
      
      const allUsers = await authManager.listUsers();
      expect(allUsers).toHaveLength(initialCount + 2);
    });

    it('should return users with correct structure', async () => {
      const users = await authManager.listUsers();
      
      expect(users.length).toBeGreaterThan(0);
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('permissions');
        expect(Array.isArray(user.permissions)).toBe(true);
      });
    });
  });

  describe('getOrganization', () => {
    it('should return existing organization', async () => {
      const org = await authManager.getOrganization('org-1');
      
      expect(org).toBeDefined();
      expect(org?.id).toBe('org-1');
      expect(org?.name).toBe('meteor-shower 企业');
    });

    it('should return null for non-existent organization', async () => {
      const org = await authManager.getOrganization('non-existent');
      
      expect(org).toBeNull();
    });
  });

  describe('updateOrganizationSettings', () => {
    it('should update organization settings', async () => {
      const newSettings = {
        allowPublicTemplates: false,
        requireApproval: true,
        maxTemplatesPerUser: 5
      };

      const success = await authManager.updateOrganizationSettings('org-1', newSettings);
      
      expect(success).toBe(true);

      const org = await authManager.getOrganization('org-1');
      expect(org?.settings.allowPublicTemplates).toBe(false);
      expect(org?.settings.requireApproval).toBe(true);
      expect(org?.settings.maxTemplatesPerUser).toBe(5);
    });

    it('should partially update organization settings', async () => {
      const partialSettings = {
        requireApproval: true
      };

      const success = await authManager.updateOrganizationSettings('org-1', partialSettings);
      
      expect(success).toBe(true);

      const org = await authManager.getOrganization('org-1');
      expect(org?.settings.requireApproval).toBe(true);
      expect(org?.settings.allowPublicTemplates).toBe(true); // Should remain unchanged
    });

    it('should return false for non-existent organization', async () => {
      const success = await authManager.updateOrganizationSettings('non-existent', {
        allowPublicTemplates: false
      });
      
      expect(success).toBe(false);
    });
  });
});