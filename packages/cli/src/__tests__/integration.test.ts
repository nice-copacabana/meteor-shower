import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('CLI Integration Tests', () => {
  let cliProcess: any;
  const testDir = path.join(process.cwd(), 'test-output');

  beforeAll(async () => {
    // 创建测试目录
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // 清理测试目录
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should show help information', async () => {
    const result = await runCLI(['--help']);
    expect(result.stdout).toContain('meteor-shower');
    expect(result.stdout).toContain('init');
    expect(result.stdout).toContain('diff');
    expect(result.stdout).toContain('apply');
  });

  it('should show version information', async () => {
    const result = await runCLI(['--version']);
    expect(result.stdout).toContain('0.1.0');
  });

  it('should handle invalid command', async () => {
    const result = await runCLI(['invalid-command']);
    expect(result.stderr).toContain('unknown command');
  });

  async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn('node', ['packages/cli/dist/index.js', ...args], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
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
    });
  }
});
