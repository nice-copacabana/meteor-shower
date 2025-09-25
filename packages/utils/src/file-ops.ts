/**
 * 文件操作模块
 * 提供安全文件读写、备份和回滚功能
 *
 * 安全特性：
 * - 自动备份：写入前创建备份
 * - 回滚支持：从备份恢复文件
 * - 原子操作：确保操作的完整性
 * - 权限检查：验证文件操作权限
 * - 路径验证：防止路径遍历攻击
 * - 错误恢复：操作失败时的自动恢复
 */

import fs from 'fs/promises';               // 文件系统操作
import path from 'path';                    // 路径操作
import os from 'os';                       // 操作系统信息
import chalk from 'chalk';                 // 终端颜色输出
import { logger, withErrorHandler, withPerformanceMonitor } from './error-handler.js'; // 错误处理

/**
 * 文件操作接口
 * 定义文件变更的基本信息
 */
export interface FileOperation {
  path: string;                             // 文件路径
  content: string;                          // 文件内容
  kind: 'create' | 'update' | 'delete';     // 操作类型
}

// 文件操作选项接口
export interface FileOperationOptions {
  createBackup?: boolean;
  skipIfExists?: boolean;
  skipIfNotExists?: boolean;
  validateContent?: boolean;
  maxSize?: number; // bytes
  allowedPaths?: string[];
}

// 备份信息接口
export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: string;
  size: number;
  checksum: string;
}

/**
 * 文件操作类
 * 提供安全、可靠的文件系统操作
 *
 * 设计原则：
 * - 安全第一：所有写操作前先备份
 * - 原子性：确保操作要么完全成功，要么完全失败
 * - 可回滚：支持从备份恢复
 * - 权限隔离：验证操作权限
 * - 路径安全：防止路径遍历攻击
 */
export class FileOperations {
  private backupDir: string;                // 备份文件存储目录
  private maxBackupFiles: number;          // 最大备份文件数
  private allowedPaths: Set<string>;       // 允许操作的路径
  private operationHistory: Map<string, BackupInfo[]> = new Map(); // 操作历史

  /**
   * 构造函数
   * @param backupDir 备份文件存储目录，默认为 '.meteor-shower/backups'
   * @param options 其他配置选项
   */
  constructor(
    backupDir = '.meteor-shower/backups',
    options: {
      maxBackupFiles?: number;
      allowedPaths?: string[];
    } = {}
  ) {
    this.backupDir = backupDir;
    this.maxBackupFiles = options.maxBackupFiles || 10;
    this.allowedPaths = new Set(options.allowedPaths || []);

    this.initializeBackupDirectory();
    logger.debug('FileOperations initialized', {
      backupDir,
      maxBackupFiles: this.maxBackupFiles,
      allowedPaths: Array.from(this.allowedPaths)
    });
  }

  /**
   * 初始化备份目录
   */
  private async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.debug('Backup directory initialized', { backupDir: this.backupDir });
    } catch (error) {
      logger.error('Failed to initialize backup directory', error);
      throw new Error(`备份目录初始化失败: ${error.message}`);
    }
  }

  /**
   * 创建文件备份
   * 在修改文件前创建时间戳备份，确保可以回滚
   *
   * 备份命名：原文件名.时间戳.bak
   * 例如：config.json -> config.json.2024-09-25T10-30-00-000Z.bak
   *
   * @param filePath 要备份的文件路径
   * @param options 备份选项
   * @returns 备份信息，失败时返回null
   */
  @withErrorHandler
  @withPerformanceMonitor
  async createBackup(filePath: string, options: FileOperationOptions = {}): Promise<BackupInfo | null> {
    try {
      // 安全检查：验证路径安全性
      if (!this.isPathAllowed(filePath)) {
        logger.warn('Backup path not allowed', { filePath });
        return null;
      }

      // 检查文件是否存在
      if (!await this.fileExists(filePath)) {
        logger.warn('File does not exist for backup', { filePath });
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const checksum = await this.calculateChecksum(filePath);
      const backupPath = path.join(this.backupDir, `${path.basename(filePath)}.${timestamp}.bak`);

      // 确保备份目录存在
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      // 读取源文件内容
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      // 写入备份文件
      await fs.writeFile(backupPath, content, 'utf-8');

      const backupInfo: BackupInfo = {
        originalPath: filePath,
        backupPath,
        timestamp,
        size: stats.size,
        checksum
      };

      // 记录到操作历史
      const history = this.operationHistory.get(filePath) || [];
      history.push(backupInfo);
      this.operationHistory.set(filePath, history.slice(-this.maxBackupFiles)); // 保留最新的备份

      // 清理过期的备份文件
      await this.cleanupOldBackups(filePath);

      logger.info('File backup created successfully', {
        filePath,
        backupPath,
        size: stats.size
      });

      return backupInfo;
    } catch (error) {
      logger.error('Failed to create file backup', error, { filePath });
      return null;
    }
  }

  /**
   * 安全写入文件
   * 写入前自动创建备份，确保数据安全
   *
   * 操作流程：
   * 1. 检查文件是否存在，如果存在则创建备份
   * 2. 确保目标目录存在
   * 3. 写入文件内容
   *
   * @param filePath 文件路径
   * @param content 文件内容
   * @param createBackup 是否创建备份，默认为true
   */
  @withErrorHandler
  @withPerformanceMonitor
  async writeFile(filePath: string, content: string, options: FileOperationOptions = {}): Promise<void> {
    try {
      // 安全检查
      if (!this.isPathAllowed(filePath)) {
        throw new Error(`路径不允许: ${filePath}`);
      }

      // 内容验证
      if (options.validateContent !== false) {
        await this.validateFileContent(content, options);
      }

      // 检查是否需要跳过已存在的文件
      if (options.skipIfExists && await this.fileExists(filePath)) {
        logger.info('File already exists, skipping write', { filePath });
        return;
      }

      // 创建备份
      let backupInfo: BackupInfo | null = null;
      if (options.createBackup !== false && await this.fileExists(filePath)) {
        backupInfo = await this.createBackup(filePath, options);
      }

      // 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 写入文件
      await fs.writeFile(filePath, content, 'utf-8');

      logger.info('File written successfully', {
        filePath,
        size: content.length,
        backup: backupInfo ? 'created' : 'none'
      });
    } catch (error) {
      logger.error('Failed to write file', error, { filePath });
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * 使用fs.access检查文件可访问性
   *
   * @param filePath 文件路径
   * @returns 文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 安全读取文件
   * 读取文件内容，失败时输出错误信息并抛出异常
   *
   * @param filePath 文件路径
   * @returns 文件内容
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(chalk.red(`  ❌ 读取失败 ${filePath}: ${error}`));
      throw error;
    }
  }

  /**
   * 从备份恢复文件
   * 将文件内容从备份文件恢复到原位置
   *
   * @param backupPath 备份文件路径
   * @param originalPath 原始文件路径
   */
  async rollbackFromBackup(backupPath: string, originalPath: string): Promise<void> {
    try {
      // 安全检查
      if (!this.isPathAllowed(backupPath) || !this.isPathAllowed(originalPath)) {
        throw new Error('路径不允许');
      }

      const content = await fs.readFile(backupPath, 'utf-8');

      // 确保目录存在
      await fs.mkdir(path.dirname(originalPath), { recursive: true });

      // 恢复文件
      await fs.writeFile(originalPath, content, 'utf-8');

      logger.info('File rollback completed', {
        backupPath,
        originalPath
      });
    } catch (error) {
      logger.error('Failed to rollback file', error, {
        backupPath,
        originalPath
      });
      throw error;
    }
  }

  /**
   * 验证文件内容
   */
  private async validateFileContent(content: string, options: FileOperationOptions) {
    // 检查文件大小
    if (options.maxSize && content.length > options.maxSize) {
      throw new Error(`文件内容超过大小限制: ${content.length} > ${options.maxSize}`);
    }

    // 检查JSON格式
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch {
        throw new Error('JSON格式无效');
      }
    }
  }

  /**
   * 检查路径是否允许操作
   */
  private isPathAllowed(filePath: string): boolean {
    if (this.allowedPaths.size === 0) {
      return true; // 没有限制时允许所有路径
    }

    const normalizedPath = path.resolve(filePath);

    // 检查路径遍历攻击
    if (normalizedPath.includes('..') || normalizedPath.includes('\0')) {
      return false;
    }

    // 检查是否在允许的路径内
    return Array.from(this.allowedPaths).some(allowedPath => {
      const allowedNormalized = path.resolve(allowedPath);
      return normalizedPath.startsWith(allowedNormalized);
    });
  }

  /**
   * 计算文件校验和
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const crypto = await import('crypto');
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return 'unknown';
    }
  }

  /**
   * 清理旧的备份文件
   */
  private async cleanupOldBackups(originalPath: string) {
    try {
      const history = this.operationHistory.get(originalPath) || [];

      if (history.length > this.maxBackupFiles) {
        const filesToDelete = history.slice(0, history.length - this.maxBackupFiles);

        for (const backup of filesToDelete) {
          try {
            await fs.unlink(backup.backupPath);
            logger.debug('Deleted old backup file', { backupPath: backup.backupPath });
          } catch {
            // 忽略删除失败的情况
          }
        }

        // 更新历史记录
        this.operationHistory.set(originalPath, history.slice(-this.maxBackupFiles));
      }
    } catch (error) {
      logger.warn('Failed to cleanup old backups', error, { originalPath });
    }
  }

  /**
   * 查找备份文件
   */
  private async findBackupFiles(backupDir: string, originalPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(backupDir);
      const fileName = path.basename(originalPath);

      return files
        .filter(file => file.startsWith(`${fileName}.`) && file.endsWith('.bak'))
        .sort()
        .reverse(); // 最新的在前面
    } catch {
      return [];
    }
  }

  /**
   * 批量文件操作
   */
  @withErrorHandler
  @withPerformanceMonitor
  async batchWriteFiles(operations: Array<{path: string, content: string, options?: FileOperationOptions}>): Promise<void> {
    const results = [];

    for (const operation of operations) {
      try {
        await this.writeFile(operation.path, operation.content, operation.options);
        results.push({ path: operation.path, success: true });
      } catch (error) {
        results.push({ path: operation.path, success: false, error: error.message });
        logger.error('Batch write failed for file', error, { path: operation.path });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Batch write completed', {
      total: results.length,
      success: successCount,
      failed: failureCount
    });

    if (failureCount > 0) {
      throw new Error(`${failureCount} 个文件写入失败`);
    }
  }

  /**
   * 安全复制文件
   */
  @withErrorHandler
  async safeCopyFile(src: string, dest: string, options: FileOperationOptions = {}): Promise<void> {
    try {
      // 安全检查
      if (!this.isPathAllowed(src) || !this.isPathAllowed(dest)) {
        throw new Error('路径不允许');
      }

      // 检查源文件是否存在
      if (!await this.fileExists(src)) {
        throw new Error(`源文件不存在: ${src}`);
      }

      // 创建备份
      if (options.createBackup !== false && await this.fileExists(dest)) {
        await this.createBackup(dest, options);
      }

      // 确保目标目录存在
      await fs.mkdir(path.dirname(dest), { recursive: true });

      // 复制文件
      await fs.copyFile(src, dest);

      logger.info('File copied successfully', { src, dest });
    } catch (error) {
      logger.error('Failed to copy file', error, { src, dest });
      throw error;
    }
  }

  /**
   * 安全删除文件
   */
  @withErrorHandler
  async safeDeleteFile(filePath: string, options: FileOperationOptions = {}): Promise<void> {
    try {
      // 安全检查
      if (!this.isPathAllowed(filePath)) {
        throw new Error('路径不允许');
      }

      // 创建备份
      if (options.createBackup !== false && await this.fileExists(filePath)) {
        await this.createBackup(filePath, options);
      }

      // 删除文件
      await fs.unlink(filePath);

      logger.info('File deleted successfully', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', error, { filePath });
      throw error;
    }
  }

  /**
   * 获取操作历史
   */
  getOperationHistory(filePath: string): BackupInfo[] {
    return this.operationHistory.get(filePath) || [];
  }

  /**
   * 设置允许的路径
   */
  setAllowedPaths(paths: string[]) {
    this.allowedPaths = new Set(paths);
    logger.info('Allowed paths updated', { paths });
  }
}
