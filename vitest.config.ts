import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 全局测试配置
    globals: true,
    environment: 'node',
    
    // 测试文件匹配模式
    include: [
      'packages/**/__tests__/**/*.{test,spec}.{js,ts}',
      'packages/**/*.{test,spec}.{js,ts}',
      'e2e/**/*.{test,spec}.{js,ts}'
    ],
    
    // 排除的文件
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage'
    ],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/**/*.{js,ts}',
        '!packages/*/src/**/*.{test,spec}.{js,ts}',
        '!packages/*/src/**/__tests__/**'
      ],
      exclude: [
        'node_modules',
        'dist',
        'build',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}' // 通常只是导出文件
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // 为关键模块设置更高的覆盖率要求
        'packages/adapters/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'packages/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 并发设置
    threads: true,
    maxThreads: 4,
    
    // 报告器配置
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml'
    },
    
    // 设置测试环境变量
    env: {
      NODE_ENV: 'test'
    }
  }
});