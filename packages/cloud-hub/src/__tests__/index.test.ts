import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock chalk to avoid colors in test output
vi.mock('chalk', () => ({
  default: {
    green: (text: string) => text,
    gray: (text: string) => text
  }
}));

describe('Cloud Hub API', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    // Dynamically import the app to ensure mocks are applied
    const cloudHubModule = await import('../index.js');
    app = cloudHubModule.default || cloudHubModule;
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (server) {
      server.close();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/v1/templates', () => {
    it('should return empty templates list initially', async () => {
      const response = await request(app)
        .get('/api/v1/templates')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        total: 0
      });
    });

    it('should filter templates by tool', async () => {
      // First, add a template
      const template = {
        id: 'test-template',
        name: 'Test Template',
        targets: ['gemini', 'claude'],
        version: '1.0.0'
      };

      await request(app)
        .post('/api/v1/templates')
        .send(template)
        .expect(200);

      // Test filtering by tool
      const response = await request(app)
        .get('/api/v1/templates?tool=gemini')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].targets).toContain('gemini');
    });

    it('should return all templates when no filter is applied', async () => {
      // Add multiple templates
      const templates = [
        {
          id: 'template-1',
          name: 'Template 1',
          targets: ['gemini'],
          version: '1.0.0'
        },
        {
          id: 'template-2',
          name: 'Template 2',
          targets: ['claude'],
          version: '1.0.0'
        }
      ];

      for (const template of templates) {
        await request(app)
          .post('/api/v1/templates')
          .send(template)
          .expect(200);
      }

      const response = await request(app)
        .get('/api/v1/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('POST /api/v1/templates', () => {
    it('should create a new template successfully', async () => {
      const template = {
        id: 'new-template',
        name: 'New Template',
        targets: ['gemini'],
        version: '1.0.0',
        variables: {
          projectName: 'default'
        }
      };

      const response = await request(app)
        .post('/api/v1/templates')
        .send(template)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining(template),
        message: '模板上传成功'
      });

      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should update existing template', async () => {
      const template = {
        id: 'existing-template',
        name: 'Existing Template',
        targets: ['gemini'],
        version: '1.0.0'
      };

      // Create template first
      await request(app)
        .post('/api/v1/templates')
        .send(template)
        .expect(200);

      // Update the same template
      const updatedTemplate = {
        ...template,
        name: 'Updated Template',
        version: '2.0.0'
      };

      const response = await request(app)
        .post('/api/v1/templates')
        .send(updatedTemplate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Template');
      expect(response.body.data.version).toBe('2.0.0');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should validate required fields', async () => {
      const invalidTemplate = {
        name: 'Invalid Template'
        // Missing id and targets
      };

      const response = await request(app)
        .post('/api/v1/templates')
        .send(invalidTemplate)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: '模板格式无效'
      });
    });

    it('should handle missing name field', async () => {
      const invalidTemplate = {
        id: 'test-id',
        targets: ['gemini']
        // Missing name
      };

      const response = await request(app)
        .post('/api/v1/templates')
        .send(invalidTemplate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('模板格式无效');
    });

    it('should handle missing targets field', async () => {
      const invalidTemplate = {
        id: 'test-id',
        name: 'Test Template'
        // Missing targets
      };

      const response = await request(app)
        .post('/api/v1/templates')
        .send(invalidTemplate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('模板格式无效');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete template lifecycle', async () => {
      const template = {
        id: 'lifecycle-template',
        name: 'Lifecycle Template',
        targets: ['gemini', 'claude'],
        version: '1.0.0',
        variables: {
          projectName: 'test-project',
          persona: 'test-persona'
        }
      };

      // 1. Create template
      const createResponse = await request(app)
        .post('/api/v1/templates')
        .send(template)
        .expect(200);

      expect(createResponse.body.success).toBe(true);

      // 2. Retrieve all templates
      const listResponse = await request(app)
        .get('/api/v1/templates')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0].id).toBe('lifecycle-template');

      // 3. Filter by tool
      const filterResponse = await request(app)
        .get('/api/v1/templates?tool=gemini')
        .expect(200);

      expect(filterResponse.body.data).toHaveLength(1);
      expect(filterResponse.body.data[0].targets).toContain('gemini');

      // 4. Update template
      const updatedTemplate = {
        ...template,
        version: '2.0.0',
        description: 'Updated description'
      };

      const updateResponse = await request(app)
        .post('/api/v1/templates')
        .send(updatedTemplate)
        .expect(200);

      expect(updateResponse.body.data.version).toBe('2.0.0');
      expect(updateResponse.body.data.description).toBe('Updated description');
    });

    it('should handle multiple templates with filtering', async () => {
      const templates = [
        {
          id: 'gemini-template',
          name: 'Gemini Template',
          targets: ['gemini'],
          version: '1.0.0'
        },
        {
          id: 'claude-template',
          name: 'Claude Template',
          targets: ['claude'],
          version: '1.0.0'
        },
        {
          id: 'multi-template',
          name: 'Multi Tool Template',
          targets: ['gemini', 'claude', 'cursor'],
          version: '1.0.0'
        }
      ];

      // Create all templates
      for (const template of templates) {
        await request(app)
          .post('/api/v1/templates')
          .send(template)
          .expect(200);
      }

      // Test filtering for gemini (should return 2: gemini-template and multi-template)
      const geminiResponse = await request(app)
        .get('/api/v1/templates?tool=gemini')
        .expect(200);

      expect(geminiResponse.body.data).toHaveLength(2);

      // Test filtering for cursor (should return 1: multi-template)
      const cursorResponse = await request(app)
        .get('/api/v1/templates?tool=cursor')
        .expect(200);

      expect(cursorResponse.body.data).toHaveLength(1);
      expect(cursorResponse.body.data[0].id).toBe('multi-template');
    });
  });
});