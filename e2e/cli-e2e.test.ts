import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('CLI End-to-End Tests', () => {
  const testDir = path.join(process.cwd(), 'e2e-test-output');
  const originalCwd = process.cwd();

  beforeAll(async () => {
    // 创建测试目录
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterAll(async () => {
    // 恢复原始工作目录
    process.chdir(originalCwd);
    
    // 清理测试目录
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should complete full init -> diff -> apply workflow', async () => {
    // 模拟用户输入
    const inputs = [
      'gemini,claude', // 选择工具
      'basic', // 选择模板
      'e2e-test-project', // 项目名称
      'E2E test persona' // 角色描述
    ];

    // 运行 init 命令
    const initResult = await runCLIWithInput(['init'], inputs);
    expect(initResult.exitCode).toBe(0);

    // 运行 diff 命令
    const diffResult = await runCLIWithInput(['diff'], []);
    expect(diffResult.exitCode).toBe(0);
    expect(diffResult.stdout).toContain('变更摘要');

    // 运行 apply 命令
    const applyResult = await runCLIWithInput(['apply', '--yes'], []);
    expect(applyResult.exitCode).toBe(0);
    expect(applyResult.stdout).toContain('配置应用成功');
  });

  it('should handle mcp test command', async () => {
    const result = await runCLIWithInput(['mcp', 'test'], []);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('MCP 服务状态');
  });

  it('should handle share command', async () => {
    const inputs = ['e2e-template', 'E2E test template'];
    const result = await runCLIWithInput(['share'], inputs);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('模板打包完成');
  });

  async function runCLIWithInput(args: string[], inputs: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn('node', ['../packages/cli/dist/index.js', ...args], {
        cwd: testDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';
      let inputIndex = 0;

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        
        // 自动回答提示
        if (inputIndex < inputs.length) {
          child.stdin?.write(inputs[inputIndex] + '\n');
          inputIndex++;
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });

      // 设置超时
      setTimeout(() => {
        child.kill();
        resolve({
          stdout,
          stderr,
          exitCode: 1
        });
      }, 30000); // 30 秒超时
    });
  }
});
