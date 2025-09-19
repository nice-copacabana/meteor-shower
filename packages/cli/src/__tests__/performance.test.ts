import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { ConfigGenerator } from '../../utils/src/config-generator.js';

describe('Performance Tests', () => {
  it('should generate config within acceptable time', async () => {
    const generator = new ConfigGenerator();
    
    const startTime = performance.now();
    
    await generator.generateConfig(
      ['gemini', 'claude', 'cursor'],
      'gemini-basic',
      { projectName: 'perf-test', persona: 'test persona' }
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 配置生成应该在 2 秒内完成
    expect(duration).toBeLessThan(2000);
  });

  it('should handle large template efficiently', async () => {
    const generator = new ConfigGenerator();
    
    const largeVariables = {
      projectName: 'large-project',
      persona: 'A'.repeat(1000), // 1KB persona
      description: 'B'.repeat(5000), // 5KB description
      rules: 'C'.repeat(10000) // 10KB rules
    };
    
    const startTime = performance.now();
    
    await generator.generateConfig(
      ['gemini', 'claude', 'cursor', 'openai'],
      'advanced-multi',
      largeVariables
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 大模板处理应该在 5 秒内完成
    expect(duration).toBeLessThan(5000);
  });

  it('should scale with multiple tools', async () => {
    const generator = new ConfigGenerator();
    const tools = ['gemini', 'claude', 'cursor', 'openai'];
    
    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      await generator.generateConfig(
        tools,
        'gemini-basic',
        { projectName: `test-${i}`, persona: 'test' }
      );
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 10 次配置生成应该在 10 秒内完成
    expect(duration).toBeLessThan(10000);
  });
});
