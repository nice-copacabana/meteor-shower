import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initCommand } from '../commands/init.js';
// Mock inquirer
vi.mock('inquirer', () => ({
    default: {
        prompt: vi.fn()
    }
}));
// Mock chalk
vi.mock('chalk', () => ({
    default: {
        cyan: (text) => text,
        green: (text) => text,
        gray: (text) => text
    }
}));
describe('initCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should initialize with default options', async () => {
        const mockInquirer = await import('inquirer');
        vi.mocked(mockInquirer.default.prompt)
            .mockResolvedValueOnce({ toolset: ['gemini', 'claude'] })
            .mockResolvedValueOnce({ template: 'basic' })
            .mockResolvedValueOnce({ projectName: 'test-project', persona: 'test persona' });
        const result = await initCommand();
        expect(result).toBeDefined();
        expect(result).toBeDefined();
        expect(result?.toolset).toEqual(['gemini', 'claude']);
        expect(result?.template).toBe('basic');
    });
    it('should handle empty toolset selection', async () => {
        const mockInquirer = await import('inquirer');
        vi.mocked(mockInquirer.default.prompt)
            .mockResolvedValueOnce({ toolset: [] })
            .mockResolvedValueOnce({ template: 'basic' })
            .mockResolvedValueOnce({ projectName: 'test-project', persona: 'test persona' });
        const result = await initCommand();
        expect(result).toBeDefined();
        expect(result?.toolset).toEqual([]);
    });
});
