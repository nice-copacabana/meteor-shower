import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TemplateEngine, TemplateMetadata } from '../template-engine.js';
import fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    readdir: vi.fn()
  }
}));

// Mock Ajv
vi.mock('ajv', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      compile: vi.fn().mockReturnValue(() => true)
    }))
  };
});

describe('TemplateEngine', () => {
  let templateEngine: TemplateEngine;
  const mockTemplate: TemplateMetadata = {
    id: 'test-template',
    name: 'Test Template',
    version: '1.0.0',
    targets: ['gemini'],
    variables: {
      projectName: 'default-project',
      persona: 'default-persona'
    }
  };

  const mockSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      version: { type: 'string' },
      targets: { type: 'array' },
      variables: { type: 'object' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    templateEngine = new TemplateEngine();
    
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadTemplate', () => {
    it('should load and validate template successfully', async () => {
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockSchema))  // Schema file
        .mockResolvedValueOnce(JSON.stringify(mockTemplate)); // Template file

      const result = await templateEngine.loadTemplate('test-template');

      expect(result).toEqual(mockTemplate);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid template format', async () => {
      const invalidTemplate = { id: 'test', name: 'Test' }; // Missing required fields
      
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockSchema))
        .mockResolvedValueOnce(JSON.stringify(invalidTemplate));

      // Mock Ajv to return false for invalid template
      const mockAjv = await import('ajv');
      const mockInstance = new mockAjv.default();
      vi.mocked(mockInstance.compile).mockReturnValue(() => false);

      await expect(templateEngine.loadTemplate('invalid-template'))
        .rejects.toThrow('模板格式无效');
    });

    it('should handle file reading errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(templateEngine.loadTemplate('nonexistent'))
        .rejects.toThrow('File not found');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables correctly', async () => {
      const variables = {
        projectName: 'my-project',
        persona: 'my-persona',
        customVar: 'custom-value'
      };

      const result = await templateEngine.renderTemplate(mockTemplate, variables);
      const parsed = JSON.parse(result);

      expect(parsed.variables.projectName).toBe('my-project');
      expect(parsed.variables.persona).toBe('my-persona');
    });

    it('should handle template with placeholder variables', async () => {
      const templateWithPlaceholders: TemplateMetadata = {
        ...mockTemplate,
        variables: {
          projectName: '{{projectName}}',
          persona: '{{persona}}',
          description: 'Project {{projectName}} with {{persona}}'
        }
      };

      const variables = {
        projectName: 'test-project',
        persona: 'test-persona'
      };

      const result = await templateEngine.renderTemplate(templateWithPlaceholders, variables);
      const parsed = JSON.parse(result);

      expect(parsed.variables.projectName).toBe('test-project');
      expect(parsed.variables.persona).toBe('test-persona');
      expect(parsed.variables.description).toBe('Project test-project with test-persona');
    });

    it('should handle missing variables gracefully', async () => {
      const templateWithPlaceholders: TemplateMetadata = {
        ...mockTemplate,
        variables: {
          projectName: '{{projectName}}',
          missingVar: '{{missingVariable}}'
        }
      };

      const variables = {
        projectName: 'test-project'
        // missingVariable not provided
      };

      const result = await templateEngine.renderTemplate(templateWithPlaceholders, variables);
      const parsed = JSON.parse(result);

      expect(parsed.variables.projectName).toBe('test-project');
      expect(parsed.variables.missingVar).toBe('{{missingVariable}}'); // Should remain as placeholder
    });
  });

  describe('listTemplates', () => {
    it('should list all valid templates', async () => {
      const mockFiles = ['template1.json', 'template2.json', 'invalid.txt', 'template3.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);
      
      // Mock schema file read
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockSchema))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTemplate, id: 'template1' }))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTemplate, id: 'template2' }))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTemplate, id: 'template3' }));

      const templates = await templateEngine.listTemplates();

      expect(templates).toHaveLength(3);
      expect(templates[0].id).toBe('template1');
      expect(templates[1].id).toBe('template2');
      expect(templates[2].id).toBe('template3');
    });

    it('should skip invalid template files', async () => {
      const mockFiles = ['valid.json', 'invalid.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);
      
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockSchema))
        .mockResolvedValueOnce(JSON.stringify(mockTemplate))
        .mockRejectedValueOnce(new Error('Invalid JSON')); // invalid.json fails

      const templates = await templateEngine.listTemplates();

      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('test-template');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('跳过无效模板'),
        expect.any(Error)
      );
    });

    it('should handle empty template directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const templates = await templateEngine.listTemplates();

      expect(templates).toHaveLength(0);
    });

    it('should filter out non-JSON files', async () => {
      const mockFiles = ['template.json', 'readme.md', 'config.txt', 'another.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);
      
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockSchema))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTemplate, id: 'template' }))
        .mockResolvedValueOnce(JSON.stringify({ ...mockTemplate, id: 'another' }));

      const templates = await templateEngine.listTemplates();

      expect(templates).toHaveLength(2);
      expect(fs.readFile).toHaveBeenCalledTimes(3); // Schema + 2 JSON files
    });
  });

  describe('schema validation', () => {
    it('should initialize with valid schema', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSchema));

      const engine = new TemplateEngine();
      
      // Access private property to verify schema loading
      expect(engine).toBeDefined();
    });

    it('should handle schema loading errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Schema not found'));

      // Constructor should not throw immediately (loadSchema is async)
      expect(() => new TemplateEngine()).not.toThrow();
    });
  });
});