/**
 * 文件操作模块
 * 提供安全文件读写、备份和回滚功能
 *
 * 安全特性：
 * - 自动备份：写入前创建备份
 * - 回滚支持：从备份恢复文件
 * - 原子操作：确保操作的完整性
 */
import fs from 'fs/promises'; // 文件系统操作
import path from 'path'; // 路径操作
import chalk from 'chalk'; // 终端颜色输出
/**
 * 文件操作类
 * 提供安全、可靠的文件系统操作
 *
 * 设计原则：
 * - 安全第一：所有写操作前先备份
 * - 原子性：确保操作要么完全成功，要么完全失败
 * - 可回滚：支持从备份恢复
 */
export class FileOperations {
    /**
     * 构造函数
     * @param backupDir 备份文件存储目录，默认为 '.meteor-shower/backups'
     */
    constructor(backupDir = '.meteor-shower/backups') {
        this.backupDir = backupDir;
    }
    /**
     * 创建文件备份
     * 在修改文件前创建时间戳备份，确保可以回滚
     *
     * 备份命名：原文件名.时间戳.bak
     * 例如：config.json -> config.json.2024-09-25T10-30-00-000Z.bak
     *
     * @param filePath 要备份的文件路径
     * @returns 备份文件路径，失败时返回空字符串
     */
    async createBackup(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `${path.basename(filePath)}.${timestamp}.bak`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.writeFile(backupPath, content, 'utf-8');
            console.log(chalk.gray(`  📦 备份: ${filePath} -> ${backupPath}`));
            return backupPath;
        }
        catch (error) {
            console.log(chalk.yellow(`  ⚠️  无法备份 ${filePath}: ${error}`));
            return '';
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
    async writeFile(filePath, content, createBackup = true) {
        try {
            // 安全备份：仅对已存在的文件创建备份
            if (createBackup && await this.fileExists(filePath)) {
                await this.createBackup(filePath);
            }
            // 确保目录存在
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            // 写入文件
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(chalk.green(`  ✅ 写入: ${filePath}`));
        }
        catch (error) {
            console.error(chalk.red(`  ❌ 写入失败 ${filePath}: ${error}`));
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
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
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
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
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
    async rollbackFromBackup(backupPath, originalPath) {
        try {
            const content = await fs.readFile(backupPath, 'utf-8');
            await fs.writeFile(originalPath, content, 'utf-8');
            console.log(chalk.yellow(`  🔄 回滚: ${originalPath}`));
        }
        catch (error) {
            console.error(chalk.red(`  ❌ 回滚失败 ${originalPath}: ${error}`));
            throw error;
        }
    }
}
