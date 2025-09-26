import chalk from 'chalk';
import { performance } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  memoryUsage?: NodeJS.MemoryUsage;
  tags?: Record<string, string>;
}

export interface OptimizationSuggestion {
  category: 'memory' | 'cpu' | 'io' | 'network';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetric[] = [];
  private thresholds = {
    slowOperation: 1000, // 1秒
    memoryWarning: 100 * 1024 * 1024, // 100MB
    memoryError: 500 * 1024 * 1024, // 500MB
  };

  // 性能计时器
  startTimer(name: string, tags?: Record<string, string>): () => PerformanceMetric {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return () => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      const metric: PerformanceMetric = {
        name,
        duration,
        startTime,
        endTime,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        },
        tags
      };

      this.metrics.push(metric);
      this.analyzeMetric(metric);

      return metric;
    };
  }

  // 异步操作性能包装器
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const stopTimer = this.startTimer(name, tags);
    
    try {
      const result = await operation();
      const metric = stopTimer();
      return { result, metric };
    } catch (error) {
      const metric = stopTimer();
      console.error(chalk.red(`❌ 操作失败: ${name} (耗时: ${metric.duration.toFixed(2)}ms)`));
      throw error;
    }
  }

  // 同步操作性能包装器
  measure<T>(
    name: string,
    operation: () => T,
    tags?: Record<string, string>
  ): { result: T; metric: PerformanceMetric } {
    const stopTimer = this.startTimer(name, tags);
    
    try {
      const result = operation();
      const metric = stopTimer();
      return { result, metric };
    } catch (error) {
      const metric = stopTimer();
      console.error(chalk.red(`❌ 操作失败: ${name} (耗时: ${metric.duration.toFixed(2)}ms)`));
      throw error;
    }
  }

  private analyzeMetric(metric: PerformanceMetric): void {
    // 检查慢操作
    if (metric.duration > this.thresholds.slowOperation) {
      console.log(chalk.yellow(`⚠️  慢操作检测: ${metric.name} 耗时 ${metric.duration.toFixed(2)}ms`));
    }

    // 检查内存使用
    if (metric.memoryUsage?.heapUsed) {
      if (metric.memoryUsage.heapUsed > this.thresholds.memoryError) {
        console.log(chalk.red(`🚨 内存使用严重告警: ${metric.name} 使用 ${(metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`));
      } else if (metric.memoryUsage.heapUsed > this.thresholds.memoryWarning) {
        console.log(chalk.yellow(`⚠️  内存使用告警: ${metric.name} 使用 ${(metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`));
      }
    }
  }

  // 生成性能报告
  generateReport(): {
    summary: {
      totalOperations: number;
      avgDuration: number;
      slowOperations: number;
      totalMemoryUsed: number;
    };
    slowestOperations: PerformanceMetric[];
    suggestions: OptimizationSuggestion[];
  } {
    const totalOperations = this.metrics.length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const slowOperations = this.metrics.filter(m => m.duration > this.thresholds.slowOperation).length;
    const totalMemoryUsed = this.metrics.reduce((sum, m) => sum + (m.memoryUsage?.heapUsed || 0), 0);

    const slowestOperations = this.metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const suggestions = this.generateOptimizationSuggestions();

    return {
      summary: {
        totalOperations,
        avgDuration,
        slowOperations,
        totalMemoryUsed
      },
      slowestOperations,
      suggestions
    };
  }

  private generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 分析慢操作
    const slowOps = this.metrics.filter(m => m.duration > this.thresholds.slowOperation);
    if (slowOps.length > 0) {
      suggestions.push({
        category: 'cpu',
        severity: 'medium',
        message: `发现 ${slowOps.length} 个慢操作`,
        recommendation: '考虑优化算法或添加缓存机制'
      });
    }

    // 分析内存使用
    const highMemoryOps = this.metrics.filter(m => 
      (m.memoryUsage?.heapUsed || 0) > this.thresholds.memoryWarning
    );
    if (highMemoryOps.length > 0) {
      suggestions.push({
        category: 'memory',
        severity: 'high',
        message: `发现 ${highMemoryOps.length} 个高内存使用操作`,
        recommendation: '检查内存泄漏，优化数据结构，考虑分页或流式处理'
      });
    }

    // 分析重复操作
    const operationCounts = this.metrics.reduce((acc, m) => {
      acc[m.name] = (acc[m.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatedOps = Object.entries(operationCounts).filter(([, count]) => count > 10);
    if (repeatedOps.length > 0) {
      suggestions.push({
        category: 'cpu',
        severity: 'low',
        message: `发现重复操作模式`,
        recommendation: '考虑添加缓存或批处理优化'
      });
    }

    return suggestions;
  }

  // 系统资源监控
  getSystemMetrics(): {
    memory: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
  } {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    };
  }

  // 内存优化工具
  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      console.log(chalk.green('🧹 手动垃圾回收完成'));
      return true;
    } else {
      console.log(chalk.yellow('⚠️  垃圾回收不可用 (需要 --expose-gc 参数)'));
      return false;
    }
  }

  // 清理旧指标
  cleanup(maxAge = 24 * 60 * 60 * 1000): void { // 默认24小时
    const now = Date.now();
    const oldCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => 
      now - metric.startTime < maxAge
    );

    const removedCount = oldCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(chalk.blue(`🧹 清理了 ${removedCount} 个旧性能指标`));
    }
  }

  // 获取性能统计
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  // 打印性能报告
  printReport(): void {
    const report = this.generateReport();
    
    console.log(chalk.magenta('\n📊 性能优化报告'));
    console.log(chalk.magenta('================'));
    
    console.log(chalk.cyan('📋 概况:'));
    console.log(`  总操作数: ${report.summary.totalOperations}`);
    console.log(`  平均耗时: ${report.summary.avgDuration.toFixed(2)}ms`);
    console.log(`  慢操作数: ${report.summary.slowOperations}`);
    console.log(`  总内存使用: ${(report.summary.totalMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    
    if (report.slowestOperations.length > 0) {
      console.log(chalk.cyan('\n⏱️  最慢的操作:'));
      report.slowestOperations.forEach((op, index) => {
        console.log(`  ${index + 1}. ${op.name}: ${op.duration.toFixed(2)}ms`);
      });
    }
    
    if (report.suggestions.length > 0) {
      console.log(chalk.cyan('\n💡 优化建议:'));
      report.suggestions.forEach((suggestion, index) => {
        const severityColor = suggestion.severity === 'high' ? chalk.red : 
                            suggestion.severity === 'medium' ? chalk.yellow : chalk.blue;
        console.log(`  ${index + 1}. [${severityColor(suggestion.severity.toUpperCase())}] ${suggestion.message}`);
        console.log(`     ${suggestion.recommendation}`);
      });
    }
    
    console.log('');
  }
}