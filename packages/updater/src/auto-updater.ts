import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  required: boolean;
  checksum: string;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'installing' | 'completed' | 'error';
  progress: number;
  message: string;
}

export class AutoUpdater {
  private currentVersion: string;
  private updateUrl: string;
  private downloadDir: string;

  constructor(currentVersion: string, updateUrl: string, downloadDir = 'updates') {
    this.currentVersion = currentVersion;
    this.updateUrl = updateUrl;
    this.downloadDir = downloadDir;
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    console.log(chalk.blue('🔍 检查更新...'));
    
    try {
      // 模拟检查更新
      const response = await fetch(`${this.updateUrl}/latest`);
      const updateInfo: UpdateInfo = await response.json();
      
      if (this.isNewerVersion(updateInfo.version, this.currentVersion)) {
        console.log(chalk.green(`✅ 发现新版本: ${updateInfo.version}`));
        return updateInfo;
      } else {
        console.log(chalk.gray('📦 已是最新版本'));
        return null;
      }
    } catch (error) {
      console.error(chalk.red('❌ 检查更新失败:'), error);
      return null;
    }
  }

  async downloadUpdate(updateInfo: UpdateInfo, onProgress?: (progress: UpdateProgress) => void): Promise<string> {
    console.log(chalk.blue('📥 下载更新...'));
    
    onProgress?.({
      stage: 'downloading',
      progress: 0,
      message: '开始下载更新包'
    });

    try {
      // 确保下载目录存在
      await fs.mkdir(this.downloadDir, { recursive: true });
      
      const fileName = `meteor-shower-${updateInfo.version}.zip`;
      const filePath = path.join(this.downloadDir, fileName);
      
      // 模拟下载过程
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.({
          stage: 'downloading',
          progress: i,
          message: `下载中... ${i}%`
        });
      }
      
      // 模拟文件写入
      await fs.writeFile(filePath, `Update package for version ${updateInfo.version}`);
      
      console.log(chalk.green(`✅ 下载完成: ${fileName}`));
      return filePath;
    } catch (error) {
      console.error(chalk.red('❌ 下载失败:'), error);
      throw error;
    }
  }

  async installUpdate(updatePath: string, onProgress?: (progress: UpdateProgress) => void): Promise<void> {
    console.log(chalk.blue('⚙️  安装更新...'));
    
    onProgress?.({
      stage: 'installing',
      progress: 0,
      message: '开始安装更新'
    });

    try {
      // 创建备份
      const backupDir = path.join(this.downloadDir, 'backup');
      await fs.mkdir(backupDir, { recursive: true });
      
      onProgress?.({
        stage: 'installing',
        progress: 25,
        message: '创建备份...'
      });

      // 模拟安装过程
      const steps = [
        { progress: 50, message: '停止服务...' },
        { progress: 75, message: '替换文件...' },
        { progress: 90, message: '更新配置...' },
        { progress: 100, message: '启动服务...' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        onProgress?.({
          stage: 'installing',
          progress: step.progress,
          message: step.message
        });
      }

      console.log(chalk.green('✅ 更新安装完成'));
      
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: '更新完成，请重启应用'
      });
    } catch (error) {
      console.error(chalk.red('❌ 安装失败:'), error);
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `安装失败: ${error}`
      });
      throw error;
    }
  }

  async performUpdate(onProgress?: (progress: UpdateProgress) => void): Promise<boolean> {
    try {
      const updateInfo = await this.checkForUpdates();
      if (!updateInfo) {
        return false;
      }

      const updatePath = await this.downloadUpdate(updateInfo, onProgress);
      await this.installUpdate(updatePath, onProgress);
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 自动更新失败:'), error);
      return false;
    }
  }

  private isNewerVersion(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    
    return false;
  }

  async rollbackUpdate(): Promise<void> {
    console.log(chalk.yellow('🔄 回滚更新...'));
    
    try {
      const backupDir = path.join(this.downloadDir, 'backup');
      const backupFiles = await fs.readdir(backupDir);
      
      if (backupFiles.length === 0) {
        throw new Error('没有找到备份文件');
      }
      
      // 模拟回滚过程
      console.log(chalk.green('✅ 回滚完成'));
    } catch (error) {
      console.error(chalk.red('❌ 回滚失败:'), error);
      throw error;
    }
  }
}
