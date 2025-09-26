import { Plugin, PluginContext } from '../plugin-manager.js';
import chalk from 'chalk';

/**
 * 性能监控插件
 * 监控配置应用性能，收集指标数据
 */
const performanceMonitorPlugin: Plugin = {
  id: 'performance-monitor',
  name: '性能监控器',
  version: '1.1.0',
  description: '监控配置应用性能，收集关键指标数据',
  author: 'meteor-shower team',
  enabled: true,
  dependencies: [],
  hooks: [
    {
      name: 'config:generate',
      handler: async (context: PluginContext) => {
        const startTime = Date.now();
        console.log(chalk.magenta('⏱️  开始性能监控...'));
        
        // 执行原始逻辑
        const result = context.data;
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 收集性能指标
        const metrics = {
          configGeneration: {
            duration,
            startTime,
            endTime,
            toolCount: result.tools?.length || 0,
            templateComplexity: calculateTemplateComplexity(result)
          }
        };
        
        console.log(chalk.magenta(`📊 配置生成耗时: ${duration}ms`));
        
        return {
          ...result,
          performance: metrics
        };
      }
    },
    {
      name: 'config:apply',
      handler: async (context: PluginContext) => {
        const startTime = Date.now();
        console.log(chalk.magenta('⏱️  监控配置应用性能...'));
        
        const result = context.data;
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 收集应用性能指标
        const applyMetrics = {
          configApplication: {
            duration,
            startTime,
            endTime,
            filesProcessed: result.files?.length || 0,
            backupCreated: !!result.backup
          }
        };
        
        // 合并性能指标
        const existingMetrics = result.performance || {};
        const combinedMetrics = {
          ...existingMetrics,
          ...applyMetrics
        };
        
        console.log(chalk.magenta(`📊 配置应用耗时: ${duration}ms`));
        
        // 生成性能报告
        generatePerformanceReport(combinedMetrics);
        
        return {
          ...result,
          performance: combinedMetrics
        };
      }
    }
  ]
};

function calculateTemplateComplexity(data: any): number {
  let complexity = 0;
  
  // 基础复杂度
  complexity += 1;
  
  // 工具数量增加复杂度
  if (data.tools) {
    complexity += data.tools.length * 2;
  }
  
  // 变量数量增加复杂度
  if (data.variables) {
    complexity += Object.keys(data.variables).length;
  }
  
  // 模板类型复杂度
  if (data.template === 'advanced') {
    complexity += 5;
  } else if (data.template === 'enterprise') {
    complexity += 10;
  }
  
  return complexity;
}

function generatePerformanceReport(metrics: any): void {
  console.log(chalk.magenta('\n📊 性能报告'));
  console.log(chalk.magenta('============'));
  
  if (metrics.configGeneration) {
    const gen = metrics.configGeneration;
    console.log(chalk.gray(`配置生成: ${gen.duration}ms`));
    console.log(chalk.gray(`  - 工具数量: ${gen.toolCount}`));
    console.log(chalk.gray(`  - 模板复杂度: ${gen.templateComplexity}`));
  }
  
  if (metrics.configApplication) {
    const app = metrics.configApplication;
    console.log(chalk.gray(`配置应用: ${app.duration}ms`));
    console.log(chalk.gray(`  - 处理文件: ${app.filesProcessed}`));
    console.log(chalk.gray(`  - 备份创建: ${app.backupCreated ? '是' : '否'}`));
  }
  
  // 计算总时间
  const totalTime = (metrics.configGeneration?.duration || 0) + 
                   (metrics.configApplication?.duration || 0);
  console.log(chalk.magenta(`总耗时: ${totalTime}ms`));
  
  // 性能评级
  let rating = 'A';
  if (totalTime > 5000) rating = 'D';
  else if (totalTime > 2000) rating = 'C';
  else if (totalTime > 1000) rating = 'B';
  
  console.log(chalk.magenta(`性能评级: ${rating}`));
  console.log('');
}

export default performanceMonitorPlugin;