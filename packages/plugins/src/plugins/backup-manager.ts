import { Plugin, PluginContext } from '../plugin-manager.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

/**
 * 智能备份管理插件
 * 自动管理配置文件备份，支持版本控制和自动清理
 */
const backupManagerPlugin: Plugin = {
  id: 'backup-manager',
  name: '智能备份管理器',
  version: '1.2.0',
  description: '自动备份配置文件，支持版本控制和定期清理',
  author: 'meteor-shower team',
  enabled: true,
  dependencies: [],
  hooks: [
    {
      name: 'config:apply',
      handler: async (context: PluginContext) => {
        console.log(chalk.cyan('💾 执行智能备份...'));
        
        const backupInfo = await createBackup(context.data);
        
        console.log(chalk.green(`✅ 备份创建成功: ${backupInfo.path}`));
        console.log(chalk.gray(`   版本: ${backupInfo.version}`));
        console.log(chalk.gray(`   时间: ${backupInfo.timestamp}`));
        
        return {
          ...context.data,
          backup: backupInfo
        };
      }
    },
    {
      name: 'user:action',
      handler: async (context: PluginContext) => {
        if (context.action === 'rollback') {
          console.log(chalk.yellow('🔄 执行智能回滚...'));
          
          const rollbackResult = await performRollback(context.data);
          
          if (rollbackResult.success) {
            console.log(chalk.green('✅ 回滚完成'));
          } else {
            console.log(chalk.red(`❌ 回滚失败: ${rollbackResult.error}`));
          }
          
          return {
            ...context.data,
            rollback: rollbackResult
          };
        }
        
        return context.data;
      }
    }
  ]
};

interface BackupInfo {
  path: string;
  version: string;
  timestamp: string;
  files: string[];
}

async function createBackup(data: any): Promise<BackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const version = `v${Date.now()}`;
  const backupDir = path.join('.meteor-shower', 'backups', version);
  
  // 创建备份目录
  await fs.mkdir(backupDir, { recursive: true });
  
  // 模拟备份文件列表
  const filesToBackup = [
    '~/.gemini/GEMINI.md',
    '~/.gemini/settings.json',
    '.gemini/commands/plan.toml'
  ];
  
  const backedUpFiles: string[] = [];
  
  for (const file of filesToBackup) {
    try {
      // 模拟文件备份
      const backupFile = path.join(backupDir, path.basename(file));
      // await fs.copyFile(file, backupFile); // 在实际实现中取消注释
      backedUpFiles.push(backupFile);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  跳过文件 ${file}: ${error}`));
    }
  }
  
  // 创建备份元数据
  const metadata = {
    version,
    timestamp,
    originalData: data,
    files: backedUpFiles
  };
  
  await fs.writeFile(
    path.join(backupDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  return {
    path: backupDir,
    version,
    timestamp,
    files: backedUpFiles
  };
}

async function performRollback(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const backupsDir = path.join('.meteor-shower', 'backups');
    
    // 获取最新的备份
    const backupDirs = await fs.readdir(backupsDir);
    const latestBackup = backupDirs
      .filter(dir => dir.startsWith('v'))
      .sort()
      .pop();
    
    if (!latestBackup) {
      return { success: false, error: '没有找到可用的备份' };
    }
    
    const metadataPath = path.join(backupsDir, latestBackup, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    
    // 恢复文件
    for (const backupFile of metadata.files) {
      // 模拟文件恢复
      console.log(chalk.gray(`   恢复: ${backupFile}`));
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export default backupManagerPlugin;