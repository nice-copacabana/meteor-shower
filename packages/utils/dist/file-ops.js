import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
export class FileOperations {
    constructor(backupDir = '.meteor-shower/backups') {
        this.backupDir = backupDir;
    }
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
    async writeFile(filePath, content, createBackup = true) {
        try {
            // 创建备份
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
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            console.error(chalk.red(`  ❌ 读取失败 ${filePath}: ${error}`));
            throw error;
        }
    }
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
