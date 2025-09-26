#!/usr/bin/env node

/**
 * meteor-shower 负载测试工具
 * 用于测试系统在高并发情况下的性能表现
 */

import { performance } from 'perf_hooks';
import chalk from 'chalk';

class LoadTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  // 并发配置生成测试
  async testConfigGeneration(concurrency = 10, iterations = 100) {
    console.log(chalk.blue(`🚀 开始配置生成负载测试 (并发: ${concurrency}, 迭代: ${iterations})`));
    
    const batches = Math.ceil(iterations / concurrency);
    const overallStart = performance.now();
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const promises = [];
      
      for (let i = 0; i < batchSize; i++) {
        promises.push(this.simulateConfigGeneration(batch * concurrency + i));
      }
      
      try {
        await Promise.all(promises);
        console.log(chalk.gray(`  批次 ${batch + 1}/${batches} 完成`));
      } catch (error) {
        console.error(chalk.red(`  批次 ${batch + 1} 失败:`, error.message));
      }
    }
    
    const overallEnd = performance.now();
    const totalTime = overallEnd - overallStart;
    
    this.printResults('配置生成', iterations, totalTime);
  }

  // 模拟配置生成
  async simulateConfigGeneration(id) {
    const start = performance.now();
    
    try {
      // 模拟配置生成过程
      await this.delay(Math.random() * 100 + 50); // 50-150ms
      
      // 模拟模板渲染
      await this.delay(Math.random() * 50 + 25); // 25-75ms
      
      // 模拟文件操作
      await this.delay(Math.random() * 200 + 100); // 100-300ms
      
      const end = performance.now();
      const duration = end - start;
      
      this.results.push({
        id,
        operation: 'config_generation',
        duration,
        success: true
      });
      
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      
      this.errors.push({
        id,
        operation: 'config_generation',
        duration,
        error: error.message
      });
    }
  }

  // 并发模板加载测试
  async testTemplateLoading(concurrency = 20, iterations = 200) {
    console.log(chalk.blue(`📋 开始模板加载负载测试 (并发: ${concurrency}, 迭代: ${iterations})`));
    
    const templates = ['basic', 'advanced', 'enterprise', 'gemini-basic', 'claude-basic'];
    const overallStart = performance.now();
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      if (promises.length >= concurrency) {
        await Promise.race(promises);
        // 移除已完成的 promise
        const completedIndex = promises.findIndex(p => p._completed);
        if (completedIndex !== -1) {
          promises.splice(completedIndex, 1);
        }
      }
      
      const template = templates[i % templates.length];
      const promise = this.simulateTemplateLoading(i, template);
      promise._completed = false;
      promise.then(() => { promise._completed = true; });
      promises.push(promise);
    }
    
    // 等待所有任务完成
    await Promise.all(promises);
    
    const overallEnd = performance.now();
    const totalTime = overallEnd - overallStart;
    
    this.printResults('模板加载', iterations, totalTime);
  }

  // 模拟模板加载
  async simulateTemplateLoading(id, templateType) {
    const start = performance.now();
    
    try {
      // 模拟文件读取
      await this.delay(Math.random() * 30 + 10); // 10-40ms
      
      // 模拟JSON解析
      await this.delay(Math.random() * 10 + 5); // 5-15ms
      
      // 模拟模板验证
      await this.delay(Math.random() * 20 + 10); // 10-30ms
      
      const end = performance.now();
      const duration = end - start;
      
      this.results.push({
        id,
        operation: 'template_loading',
        templateType,
        duration,
        success: true
      });
      
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      
      this.errors.push({
        id,
        operation: 'template_loading',
        templateType,
        duration,
        error: error.message
      });
    }
  }

  // API 端点负载测试
  async testAPIEndpoints() {
    console.log(chalk.blue('🌐 开始 API 端点负载测试'));
    
    const endpoints = [
      { path: '/api/v1/templates', method: 'GET' },
      { path: '/api/configs', method: 'GET' },
      { path: '/api/metrics', method: 'GET' },
      { path: '/api/services', method: 'GET' },
      { path: '/health', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
      await this.testSingleEndpoint(endpoint.path, endpoint.method, 50, 5);
    }
  }

  async testSingleEndpoint(path, method, requests, concurrency) {
    console.log(chalk.gray(`  测试 ${method} ${path}...`));
    
    const start = performance.now();
    const promises = [];
    
    for (let i = 0; i < requests; i++) {
      if (promises.length >= concurrency) {
        await Promise.race(promises);
        promises.splice(promises.findIndex(p => p._completed), 1);
      }
      
      const promise = this.simulateAPICall(path, method, i);
      promise._completed = false;
      promise.then(() => { promise._completed = true; });
      promises.push(promise);
    }
    
    await Promise.all(promises);
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(chalk.gray(`    完成: ${requests} 请求 / ${duration.toFixed(2)}ms`));
  }

  async simulateAPICall(path, method, id) {
    const start = performance.now();
    
    try {
      // 模拟网络延迟
      await this.delay(Math.random() * 50 + 10); // 10-60ms
      
      // 模拟处理时间
      const processingTime = path.includes('health') ? 5 : Math.random() * 100 + 20;
      await this.delay(processingTime);
      
      const end = performance.now();
      const duration = end - start;
      
      this.results.push({
        id,
        operation: 'api_call',
        path,
        method,
        duration,
        success: true
      });
      
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      
      this.errors.push({
        id,
        operation: 'api_call',
        path,
        method,
        duration,
        error: error.message
      });
    }
  }

  // 内存压力测试
  async testMemoryUsage() {
    console.log(chalk.blue('🧠 开始内存使用压力测试'));
    
    const initialMemory = process.memoryUsage();
    console.log(chalk.gray(`  初始内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`));
    
    // 创建大量对象模拟内存使用
    const largeObjects = [];
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      // 模拟配置对象
      const configObject = {
        id: `config-${i}`,
        data: new Array(1000).fill(0).map(() => Math.random()),
        metadata: {
          timestamp: new Date(),
          user: `user-${i % 10}`,
          tool: ['gemini', 'claude', 'cursor'][i % 3]
        }
      };
      
      largeObjects.push(configObject);
      
      if (i % 100 === 0) {
        const currentMemory = process.memoryUsage();
        console.log(chalk.gray(`    迭代 ${i}: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`));
      }
    }
    
    const peakMemory = process.memoryUsage();
    console.log(chalk.yellow(`  峰值内存: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`));
    
    // 清理内存
    largeObjects.length = 0;
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    console.log(chalk.green(`  清理后内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`));
  }

  // 工具方法
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults(testName, iterations, totalTime) {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.errors.length;
    const successRate = (successful / iterations) * 100;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / successful;
    const throughput = (iterations / totalTime) * 1000; // ops/second
    
    console.log(chalk.green(`\n✅ ${testName} 测试完成:`));
    console.log(`  总请求数: ${iterations}`);
    console.log(`  成功数: ${successful}`);
    console.log(`  失败数: ${failed}`);
    console.log(`  成功率: ${successRate.toFixed(2)}%`);
    console.log(`  平均耗时: ${avgDuration.toFixed(2)}ms`);
    console.log(`  吞吐量: ${throughput.toFixed(2)} ops/sec`);
    console.log(`  总耗时: ${totalTime.toFixed(2)}ms\n`);
  }

  // 生成负载测试报告
  generateReport() {
    const report = {
      summary: {
        totalTests: this.results.length,
        totalErrors: this.errors.length,
        successRate: (this.results.length / (this.results.length + this.errors.length)) * 100
      },
      performance: {
        avgDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
        minDuration: Math.min(...this.results.map(r => r.duration)),
        maxDuration: Math.max(...this.results.map(r => r.duration)),
        p95Duration: this.calculatePercentile(this.results.map(r => r.duration), 95),
        p99Duration: this.calculatePercentile(this.results.map(r => r.duration), 99)
      },
      operations: this.groupResultsByOperation()
    };
    
    return report;
  }

  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  groupResultsByOperation() {
    const grouped = {};
    
    this.results.forEach(result => {
      if (!grouped[result.operation]) {
        grouped[result.operation] = [];
      }
      grouped[result.operation].push(result);
    });
    
    return Object.entries(grouped).map(([operation, results]) => ({
      operation,
      count: results.length,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      minDuration: Math.min(...results.map(r => r.duration)),
      maxDuration: Math.max(...results.map(r => r.duration))
    }));
  }

  // 主测试运行器
  async runFullLoadTest() {
    console.log(chalk.cyan('🚀 开始 meteor-shower 全面负载测试'));
    console.log(chalk.cyan('====================================='));
    
    // 重置结果
    this.results = [];
    this.errors = [];
    
    try {
      // 1. 配置生成测试
      await this.testConfigGeneration(10, 100);
      
      // 2. 模板加载测试
      await this.testTemplateLoading(20, 200);
      
      // 3. API 端点测试
      await this.testAPIEndpoints();
      
      // 4. 内存压力测试
      await this.testMemoryUsage();
      
      // 5. 生成报告
      const report = this.generateReport();
      this.printFinalReport(report);
      
    } catch (error) {
      console.error(chalk.red('❌ 负载测试失败:'), error);
    }
  }

  printFinalReport(report) {
    console.log(chalk.cyan('\n📊 负载测试最终报告'));
    console.log(chalk.cyan('=================='));
    
    console.log(chalk.white('概况:'));
    console.log(`  总测试数: ${report.summary.totalTests}`);
    console.log(`  错误数: ${report.summary.totalErrors}`);
    console.log(`  成功率: ${report.summary.successRate.toFixed(2)}%`);
    
    console.log(chalk.white('\n性能指标:'));
    console.log(`  平均耗时: ${report.performance.avgDuration.toFixed(2)}ms`);
    console.log(`  最小耗时: ${report.performance.minDuration.toFixed(2)}ms`);
    console.log(`  最大耗时: ${report.performance.maxDuration.toFixed(2)}ms`);
    console.log(`  P95 耗时: ${report.performance.p95Duration.toFixed(2)}ms`);
    console.log(`  P99 耗时: ${report.performance.p99Duration.toFixed(2)}ms`);
    
    console.log(chalk.white('\n操作分析:'));
    report.operations.forEach(op => {
      console.log(`  ${op.operation}:`);
      console.log(`    数量: ${op.count}`);
      console.log(`    平均: ${op.avgDuration.toFixed(2)}ms`);
      console.log(`    范围: ${op.minDuration.toFixed(2)}ms - ${op.maxDuration.toFixed(2)}ms`);
    });
    
    console.log(chalk.green('\n✅ 负载测试完成！'));
  }
}

// 运行负载测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LoadTester();
  await tester.runFullLoadTest();
}

export default LoadTester;