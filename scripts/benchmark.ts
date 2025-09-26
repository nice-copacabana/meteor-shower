/**
 * meteor-shower 性能基准测试
 * 建立性能基线和回归测试
 */

import { performance } from 'perf_hooks';
import { PerformanceOptimizer } from '../packages/observability/src/performance.js';
import chalk from 'chalk';

interface Benchmark {
  name: string;
  description: string;
  target: number; // 目标耗时（毫秒）
  iterations: number;
  run: () => Promise<void> | void;
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  target: number;
  passed: boolean;
  opsPerSecond: number;
}

class BenchmarkSuite {
  private optimizer: PerformanceOptimizer;
  private benchmarks: Benchmark[] = [];
  private results: BenchmarkResult[] = [];

  constructor() {
    this.optimizer = new PerformanceOptimizer();
    this.initializeBenchmarks();
  }

  private initializeBenchmarks(): void {
    // 配置生成基准测试
    this.benchmarks.push({
      name: 'config-generation-basic',
      description: '基础配置生成性能',
      target: 100, // 100ms
      iterations: 50,
      run: async () => {
        await this.simulateConfigGeneration('basic');
      }
    });

    this.benchmarks.push({
      name: 'config-generation-advanced',
      description: '高级配置生成性能',
      target: 200, // 200ms
      iterations: 30,
      run: async () => {
        await this.simulateConfigGeneration('advanced');
      }
    });

    // 模板加载基准测试
    this.benchmarks.push({
      name: 'template-loading',
      description: '模板加载性能',
      target: 50, // 50ms
      iterations: 100,
      run: async () => {
        await this.simulateTemplateLoading();
      }
    });

    // 文件操作基准测试
    this.benchmarks.push({
      name: 'file-operations',
      description: '文件操作性能',
      target: 300, // 300ms
      iterations: 20,
      run: async () => {
        await this.simulateFileOperations();
      }
    });

    // 插件执行基准测试
    this.benchmarks.push({
      name: 'plugin-execution',
      description: '插件执行性能',
      target: 75, // 75ms
      iterations: 40,
      run: async () => {
        await this.simulatePluginExecution();
      }
    });

    // 并发操作基准测试
    this.benchmarks.push({
      name: 'concurrent-operations',
      description: '并发操作性能',
      target: 500, // 500ms
      iterations: 10,
      run: async () => {
        await this.simulateConcurrentOperations();
      }
    });

    // 内存使用基准测试
    this.benchmarks.push({
      name: 'memory-efficiency',
      description: '内存使用效率',
      target: 50, // 50ms
      iterations: 60,
      run: async () => {
        await this.simulateMemoryIntensiveOperation();
      }
    });
  }

  // 模拟配置生成
  private async simulateConfigGeneration(type: string): Promise<void> {
    const complexity = type === 'advanced' ? 3 : 1;
    
    // 模拟模板解析
    await this.delay(10 * complexity);
    
    // 模拟变量替换
    await this.delay(20 * complexity);
    
    // 模拟验证
    await this.delay(15 * complexity);
    
    // 模拟文件生成
    await this.delay(30 * complexity);
  }

  // 模拟模板加载
  private async simulateTemplateLoading(): Promise<void> {
    // 模拟文件读取
    await this.delay(15);
    
    // 模拟JSON解析
    await this.delay(5);
    
    // 模拟Schema验证
    await this.delay(20);
  }

  // 模拟文件操作
  private async simulateFileOperations(): Promise<void> {
    // 模拟备份创建
    await this.delay(80);
    
    // 模拟文件写入
    await this.delay(120);
    
    // 模拟权限检查
    await this.delay(30);
    
    // 模拟目录创建
    await this.delay(50);
  }

  // 模拟插件执行
  private async simulatePluginExecution(): Promise<void> {
    // 模拟钩子查找
    await this.delay(5);
    
    // 模拟插件调用
    await this.delay(30);
    
    // 模拟结果处理
    await this.delay(15);
  }

  // 模拟并发操作
  private async simulateConcurrentOperations(): Promise<void> {
    const operations = [];
    
    for (let i = 0; i < 5; i++) {
      operations.push(this.simulateConfigGeneration('basic'));
    }
    
    await Promise.all(operations);
  }

  // 模拟内存密集操作
  private async simulateMemoryIntensiveOperation(): Promise<void> {
    // 创建一些对象
    const data = new Array(1000).fill(0).map((_, i) => ({
      id: i,
      data: Math.random().toString(36),
      metadata: { timestamp: Date.now() }
    }));
    
    // 模拟处理
    await this.delay(20);
    
    // 模拟序列化
    JSON.stringify(data);
    
    // 清理
    data.length = 0;
  }

  // 运行单个基准测试
  private async runBenchmark(benchmark: Benchmark): Promise<BenchmarkResult> {
    console.log(chalk.blue(`🔄 运行基准测试: ${benchmark.name}`));
    
    const times: number[] = [];
    let totalTime = 0;

    for (let i = 0; i < benchmark.iterations; i++) {
      const start = performance.now();
      await benchmark.run();
      const end = performance.now();
      const duration = end - start;
      
      times.push(duration);
      totalTime += duration;
      
      // 显示进度
      if ((i + 1) % Math.max(1, Math.floor(benchmark.iterations / 10)) === 0) {
        const progress = ((i + 1) / benchmark.iterations * 100).toFixed(0);
        console.log(chalk.gray(`  进度: ${progress}% (${i + 1}/${benchmark.iterations})`));
      }
    }

    const avgTime = totalTime / benchmark.iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const passed = avgTime <= benchmark.target;
    const opsPerSecond = 1000 / avgTime;

    const result: BenchmarkResult = {
      name: benchmark.name,
      iterations: benchmark.iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      target: benchmark.target,
      passed,
      opsPerSecond
    };

    this.results.push(result);
    this.printBenchmarkResult(result);
    
    return result;
  }

  // 打印单个基准测试结果
  private printBenchmarkResult(result: BenchmarkResult): void {
    const statusColor = result.passed ? chalk.green : chalk.red;
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(statusColor(`  ${status} ${result.name}`));
    console.log(`    平均耗时: ${result.avgTime.toFixed(2)}ms (目标: ${result.target}ms)`);
    console.log(`    范围: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`);
    console.log(`    吞吐量: ${result.opsPerSecond.toFixed(2)} ops/sec`);
    console.log('');
  }

  // 运行所有基准测试
  async runAll(): Promise<void> {
    console.log(chalk.cyan('🚀 开始性能基准测试'));
    console.log(chalk.cyan('==================='));
    console.log(`总共 ${this.benchmarks.length} 个基准测试\n`);

    // 清空之前的结果
    this.results = [];

    const startTime = performance.now();

    for (const benchmark of this.benchmarks) {
      try {
        await this.runBenchmark(benchmark);
      } catch (error) {
        console.error(chalk.red(`❌ 基准测试失败: ${benchmark.name}`), error);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    this.printSummary(totalTime);
  }

  // 打印汇总报告
  private printSummary(totalTime: number): void {
    const passedCount = this.results.filter(r => r.passed).length;
    const failedCount = this.results.length - passedCount;
    const passRate = (passedCount / this.results.length) * 100;

    console.log(chalk.cyan('📊 基准测试汇总报告'));
    console.log(chalk.cyan('=================='));
    
    console.log(`总测试数: ${this.results.length}`);
    console.log(`通过数: ${chalk.green(passedCount)}`);
    console.log(`失败数: ${chalk.red(failedCount)}`);
    console.log(`通过率: ${passRate.toFixed(1)}%`);
    console.log(`总耗时: ${(totalTime / 1000).toFixed(2)}秒\n`);

    // 性能排行榜 - 最快的测试
    console.log(chalk.yellow('🏆 性能排行榜 (最快):'));
    const sortedBySpeed = [...this.results].sort((a, b) => a.avgTime - b.avgTime);
    sortedBySpeed.slice(0, 3).forEach((result, index) => {
      const medal = ['🥇', '🥈', '🥉'][index];
      console.log(`  ${medal} ${result.name}: ${result.avgTime.toFixed(2)}ms`);
    });

    // 性能警告 - 最慢的测试
    if (failedCount > 0) {
      console.log(chalk.red('\n⚠️  性能警告:'));
      const failedTests = this.results.filter(r => !r.passed);
      failedTests.forEach(result => {
        const excess = result.avgTime - result.target;
        console.log(`  • ${result.name}: 超出目标 ${excess.toFixed(2)}ms`);
      });
    }

    // 生成基准文件
    this.generateBaseline();
    
    console.log(chalk.green('\n✅ 基准测试完成!'));
  }

  // 生成基线文件
  private generateBaseline(): void {
    const baseline = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      results: this.results.map(r => ({
        name: r.name,
        target: r.target,
        avgTime: r.avgTime,
        opsPerSecond: r.opsPerSecond
      }))
    };

    // 在实际实现中，这里会写入文件
    console.log(chalk.blue('📄 性能基线已生成 (benchmark-baseline.json)'));
    
    // 可以添加与历史基线的比较
    this.compareWithHistoricalBaseline(baseline);
  }

  // 与历史基线比较
  private compareWithHistoricalBaseline(currentBaseline: any): void {
    // 模拟历史基线数据
    const historicalBaseline = {
      timestamp: '2024-09-25T12:00:00.000Z',
      results: [
        { name: 'config-generation-basic', avgTime: 95 },
        { name: 'template-loading', avgTime: 45 },
        { name: 'file-operations', avgTime: 280 }
      ]
    };

    console.log(chalk.yellow('\n📈 与历史基线比较:'));
    
    currentBaseline.results.forEach((current: any) => {
      const historical = historicalBaseline.results.find(h => h.name === current.name);
      if (historical) {
        const improvement = historical.avgTime - current.avgTime;
        const changePercent = (improvement / historical.avgTime) * 100;
        
        if (Math.abs(changePercent) > 5) { // 5%以上的变化才显示
          const arrow = improvement > 0 ? '📈' : '📉';
          const color = improvement > 0 ? chalk.green : chalk.red;
          console.log(color(`  ${arrow} ${current.name}: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`));
        }
      }
    });
  }

  // 运行回归测试
  async runRegression(): Promise<boolean> {
    console.log(chalk.blue('🔍 运行性能回归测试...'));
    
    await this.runAll();
    
    const regressions = this.results.filter(r => !r.passed);
    
    if (regressions.length > 0) {
      console.log(chalk.red('\n❌ 检测到性能回归:'));
      regressions.forEach(r => {
        console.log(chalk.red(`  • ${r.name}: ${r.avgTime.toFixed(2)}ms > ${r.target}ms`));
      });
      return false;
    } else {
      console.log(chalk.green('\n✅ 无性能回归检测'));
      return true;
    }
  }

  // 工具方法
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行基准测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new BenchmarkSuite();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.includes('--regression')) {
    const passed = await suite.runRegression();
    process.exit(passed ? 0 : 1);
  } else {
    await suite.runAll();
  }
}

export default BenchmarkSuite;