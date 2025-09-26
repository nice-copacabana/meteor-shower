import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAdapter } from '../gemini.js';
import { ApplyContext } from '../index.js';

// Mock dependencies
vi.mock('@meteor-shower/utils', () => ({
  FileOperations: vi.fn().mockImplementation(() => ({
    writeFile: vi.fn().mockResolvedValue(undefined),
    rollbackFromBackup: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('template content with {{projectName}}'),
  mkdir: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('os', () => ({
  homedir: vi.fn().mockReturnValue('/home/user')
}));

vi.mock('chalk', () => ({
  default: {
    green: (text: string) => text,
    gray: (text: string) => text,
    yellow: (text: string) => text,
    red: (text: string) => text
  }
}));

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;
  let mockContext: ApplyContext;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GeminiAdapter();
    mockContext = {
      variables: {
        projectName: 'test-project',
        persona: 'test persona',
        projectDescription: 'test description'
      },
      dryRun: false
    };
  });

  describe('plan', () => {
    it('should return planned changes', async () => {
      const result = await adapter.plan(mockContext);

      expect(result).toBeDefined();
      expect(result.changes).toHaveLength(3);
      expect(result.changes[0].path).toBe('~/.gemini/GEMINI.md');
      expect(result.changes[0].kind).toBe('create');
      expect(result.summary).toContain('将创建 3 个 Gemini 配置文件');
    });
  });

  describe('apply', () => {
    it('should apply configuration when not in dry run mode', async () => {
      await adapter.apply(mockContext);

      // Verify that writeFile was called for each config file
      const mockFileOps = vi.mocked(await import('@meteor-shower/utils')).FileOperations;
      const mockInstance = mockFileOps.mock.instances[0];
      expect(mockInstance.writeFile).toHaveBeenCalledTimes(3);
    });

    it('should skip actual writing in dry run mode', async () => {
      mockContext.dryRun = true;

      await adapter.apply(mockContext);

      // Verify that writeFile was not called in dry run mode
      const mockFileOps = vi.mocked(await import('@meteor-shower/utils')).FileOperations;
      const mockInstance = mockFileOps.mock.instances[0];
      expect(mockInstance.writeFile).not.toHaveBeenCalled();
    });

    it('should handle template rendering correctly', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue('Project: {{projectName}}, Persona: {{persona}}');

      await adapter.apply(mockContext);

      const mockFileOps = vi.mocked(await import('@meteor-shower/utils')).FileOperations;
      const mockInstance = mockFileOps.mock.instances[0];
      
      // Check that template variables were replaced
      const writeFileCall = vi.mocked(mockInstance.writeFile).mock.calls[0];
      const renderedContent = writeFileCall[1];
      expect(renderedContent).toContain('test-project');
      expect(renderedContent).toContain('test persona');
    });
  });

  describe('rollback', () => {
    it('should rollback configurations successfully', async () => {
      // First apply to create backup paths
      await adapter.apply(mockContext);
      
      // Then rollback
      await adapter.rollback(mockContext);

      const mockFileOps = vi.mocked(await import('@meteor-shower/utils')).FileOperations;
      const mockInstance = mockFileOps.mock.instances[0];
      expect(mockInstance.rollbackFromBackup).toHaveBeenCalled();
    });

    it('should handle rollback errors gracefully', async () => {
      const mockFileOps = vi.mocked(await import('@meteor-shower/utils')).FileOperations;
      const mockInstance = mockFileOps.mock.instances[0];
      
      // Mock rollback failure
      vi.mocked(mockInstance.rollbackFromBackup).mockRejectedValue(new Error('Rollback failed'));

      // Should not throw, but handle error gracefully
      await expect(adapter.rollback(mockContext)).resolves.not.toThrow();
    });
  });

  describe('template rendering', () => {
    it('should replace all template variables', async () => {
      const templateContent = 'Project: {{projectName}}, Persona: {{persona}}, Desc: {{projectDescription}}';
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(templateContent);

      // Access private method for testing
      const renderMethod = (adapter as any).renderConfigTemplate;
      const result = await renderMethod.call(adapter, 'test.template', mockContext.variables);

      expect(result).toBe('Project: test-project, Persona: test persona, Desc: test description');
    });

    it('should handle missing template variables gracefully', async () => {
      const templateContent = 'Project: {{projectName}}, Missing: {{missingVar}}';
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(templateContent);

      const renderMethod = (adapter as any).renderConfigTemplate;
      const result = await renderMethod.call(adapter, 'test.template', { projectName: 'test' });

      expect(result).toBe('Project: test, Missing: {{missingVar}}');
    });
  });
});