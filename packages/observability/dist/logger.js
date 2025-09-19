import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
export class Logger {
    constructor(logDir = 'logs', maxFileSize = 10 * 1024 * 1024, maxFiles = 5) {
        this.logDir = logDir;
        this.maxFileSize = maxFileSize;
        this.maxFiles = maxFiles;
        this.ensureLogDir();
    }
    async ensureLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }
    getLogFileName(level) {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${level}-${date}.log`);
    }
    async writeToFile(entry) {
        try {
            const fileName = this.getLogFileName(entry.level);
            const logLine = JSON.stringify(entry) + '\n';
            await fs.appendFile(fileName, logLine, 'utf-8');
            // 检查文件大小并轮转
            const stats = await fs.stat(fileName);
            if (stats.size > this.maxFileSize) {
                await this.rotateLogFile(fileName);
            }
        }
        catch (error) {
            console.error('Failed to write log:', error);
        }
    }
    async rotateLogFile(fileName) {
        try {
            const baseName = fileName.replace('.log', '');
            // 移动现有文件
            for (let i = this.maxFiles - 1; i > 0; i--) {
                const oldFile = `${baseName}.${i}.log`;
                const newFile = `${baseName}.${i + 1}.log`;
                try {
                    await fs.rename(oldFile, newFile);
                }
                catch {
                    // 文件不存在，忽略
                }
            }
            // 移动当前文件
            await fs.rename(fileName, `${baseName}.1.log`);
        }
        catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }
    getColor(level) {
        switch (level) {
            case 'debug': return chalk.gray;
            case 'info': return chalk.blue;
            case 'warn': return chalk.yellow;
            case 'error': return chalk.red;
            default: return chalk.white;
        }
    }
    async log(level, message, context, userId, requestId) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            userId,
            requestId
        };
        // 控制台输出
        const color = this.getColor(level);
        console.log(color(this.formatMessage(level, message, context)));
        // 文件输出
        await this.writeToFile(entry);
    }
    async debug(message, context, userId, requestId) {
        await this.log('debug', message, context, userId, requestId);
    }
    async info(message, context, userId, requestId) {
        await this.log('info', message, context, userId, requestId);
    }
    async warn(message, context, userId, requestId) {
        await this.log('warn', message, context, userId, requestId);
    }
    async error(message, context, userId, requestId) {
        await this.log('error', message, context, userId, requestId);
    }
    async queryLogs(level, userId, startTime, endTime) {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log') && (!level || file.startsWith(level)));
            const allLogs = [];
            for (const file of logFiles) {
                try {
                    const content = await fs.readFile(path.join(this.logDir, file), 'utf-8');
                    const lines = content.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const entry = JSON.parse(line);
                            // 过滤条件
                            if (userId && entry.userId !== userId)
                                continue;
                            if (startTime && new Date(entry.timestamp) < startTime)
                                continue;
                            if (endTime && new Date(entry.timestamp) > endTime)
                                continue;
                            allLogs.push(entry);
                        }
                        catch {
                            // 忽略无效的 JSON 行
                        }
                    }
                }
                catch {
                    // 忽略无法读取的文件
                }
            }
            return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        catch (error) {
            console.error('Failed to query logs:', error);
            return [];
        }
    }
}
