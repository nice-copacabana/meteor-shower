import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileOperations } from '../file-ops.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn()
  }
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    gray: (text: string) => text,
    green: (text: string) => text,
    yellow: (text: string) => text,
    red: (text: string) => text
  }
}));

describe('FileOperations', () => {
  let fileOps: FileOperations;
  const testBackupDir = './test-backups';
  const testFilePath = '/test/file.txt';
  const testContent = 'test content';

  beforeEach(() => {
    vi.clearAllMocks();
    fileOps = new FileOperations(testBackupDir);
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBackup', () => {
    it('should create backup successfully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(testContent);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const backupPath = await fileOps.createBackup(testFilePath);

      expect(backupPath).toContain(testBackupDir);
      expect(backupPath).toContain('file.txt');
      expect(fs.readFile).toHaveBeenCalledWith(testFilePath, 'utf-8');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(testBackupDir),
        testContent,
        'utf-8'
      );
    });

    it('should handle backup failure gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const backupPath = await fileOps.createBackup(testFilePath);

      expect(backupPath).toBe('');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('无法备份')
      );
    });

    it('should create backup directory if it does not exist', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(testContent);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await fileOps.createBackup(testFilePath);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(testBackupDir),
        { recursive: true }
      );
    });
  });

  describe('writeFile', () => {
    it('should write file successfully without backup', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await fileOps.writeFile(testFilePath, testContent, false);

      expect(fs.writeFile).toHaveBeenCalledWith(testFilePath, testContent, 'utf-8');
      expect(fs.readFile).not.toHaveBeenCalled(); // No backup created
    });

    it('should create backup before writing if file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined); // File exists
      vi.mocked(fs.readFile).mockResolvedValue('old content');
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await fileOps.writeFile(testFilePath, testContent, true);

      expect(fs.readFile).toHaveBeenCalledWith(testFilePath, 'utf-8'); // Backup created
      expect(fs.writeFile).toHaveBeenCalledTimes(2); // Backup + actual file
    });

    it('should create parent directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await fileOps.writeFile(testFilePath, testContent);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.dirname(testFilePath),
        { recursive: true }
      );
    });

    it('should handle write errors', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(fileOps.writeFile(testFilePath, testContent)).rejects.toThrow('Write failed');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('写入失败')
      );
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const exists = await fileOps.fileExists(testFilePath);

      expect(exists).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(testFilePath);
    });

    it('should return false if file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const exists = await fileOps.fileExists(testFilePath);

      expect(exists).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(testContent);

      const content = await fileOps.readFile(testFilePath);

      expect(content).toBe(testContent);
      expect(fs.readFile).toHaveBeenCalledWith(testFilePath, 'utf-8');
    });

    it('should handle read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read failed'));

      await expect(fileOps.readFile(testFilePath)).rejects.toThrow('Read failed');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('读取失败')
      );
    });
  });

  describe('rollbackFromBackup', () => {
    it('should rollback from backup successfully', async () => {
      const backupPath = '/backup/file.txt.backup';
      vi.mocked(fs.readFile).mockResolvedValue(testContent);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await fileOps.rollbackFromBackup(backupPath, testFilePath);

      expect(fs.readFile).toHaveBeenCalledWith(backupPath, 'utf-8');
      expect(fs.writeFile).toHaveBeenCalledWith(testFilePath, testContent, 'utf-8');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('回滚')
      );
    });

    it('should handle rollback errors', async () => {
      const backupPath = '/backup/file.txt.backup';
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Backup not found'));

      await expect(fileOps.rollbackFromBackup(backupPath, testFilePath))
        .rejects.toThrow('Backup not found');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('回滚失败')
      );
    });
  });
});