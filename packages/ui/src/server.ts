import express from 'express';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.UI_PORT || 3001;

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API 路由
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

app.post('/api/generate-config', async (req, res) => {
  try {
    const { tools, template, projectName, persona } = req.body;

    // 导入配置生成器
    const { ConfigGenerator } = await import('../../utils/config-generator.js');

    const configGen = new ConfigGenerator();
    const config = await configGen.generateConfig(tools, template, { projectName, persona });

    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/apply-config', async (req, res) => {
  try {
    const { config, dryRun = false } = req.body;

    // 导入适配器
    const { createAdapter } = await import('../../adapters/index.js');

    const results = [];

    // 按工具应用配置
    for (const tool of config.tools) {
      const adapter = createAdapter(tool);
      const toolOperations = config.operations.filter((op: any) => op.target === tool);

      const context = {
        target: tool,
        dryRun,
        variables: { ...config, operations: toolOperations }
      };

      try {
        await adapter.apply(context);
        results.push({ tool, success: true });
      } catch (error) {
        results.push({ tool, success: false, error: error.message });
      }
    }

    const allSuccess = results.every(r => r.success);

    res.json({
      success: allSuccess,
      message: allSuccess ? '配置应用成功' : '部分配置应用失败',
      results,
      files: config.operations.map((op: any) => op.path)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/mcp-status', (req, res) => {
  // 模拟 MCP 服务检查
  const services = [
    { name: 'GitHub MCP', endpoint: 'localhost:3001', status: 'online', latency: '12ms' },
    { name: 'Vector RAG', endpoint: 'localhost:3002', status: 'online', latency: '8ms' },
    { name: 'Local Tools', endpoint: 'localhost:3003', status: 'offline', latency: 'N/A' }
  ];
  
  res.json({
    success: true,
    services
  });
});

// API代理到Cloud Hub
app.get('/api/v1/templates', async (req, res) => {
  try {
    // 代理请求到Cloud Hub
    const cloudHubUrl = `http://localhost:3000/api/v1/templates`;
    const response = await fetch(cloudHubUrl + '?' + new URLSearchParams(req.query as any));
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '无法连接到Cloud Hub服务'
    });
  }
});

app.get('/api/v1/templates/:id', async (req, res) => {
  try {
    const cloudHubUrl = `http://localhost:3000/api/v1/templates/${req.params.id}`;
    const response = await fetch(cloudHubUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '无法连接到Cloud Hub服务'
    });
  }
});

app.post('/api/v1/templates/:id/download', async (req, res) => {
  try {
    const cloudHubUrl = `http://localhost:3000/api/v1/templates/${req.params.id}/download`;
    const response = await fetch(cloudHubUrl, { method: 'POST' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '无法连接到Cloud Hub服务'
    });
  }
});

app.post('/api/open-file', async (req, res) => {
  try {
    const { path: filePath } = req.body;

    // 导入文件操作
    const { FileOperations } = await import('../../utils/file-ops.js');
    const fileOps = new FileOperations();

    // 检查文件是否存在
    if (await fileOps.fileExists(filePath)) {
      res.json({
        success: true,
        message: `文件已准备打开: ${filePath}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/system-stats', async (req, res) => {
  try {
    // 模拟系统统计数据
    const stats = {
      cpuUsage: Math.floor(Math.random() * 30 + 20),
      memoryUsage: Math.floor(Math.random() * 40 + 30),
      diskUsage: Math.floor(Math.random() * 20 + 60),
      networkLatency: Math.floor(Math.random() * 50 + 10),
      activeConnections: Math.floor(Math.random() * 100 + 50),
      templatesCount: 15,
      downloadsCount: 234
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function getConfigPath(tool: string): string {
  const paths: Record<string, string> = {
    gemini: '~/.gemini/GEMINI.md',
    claude: '~/.claude/claude_desktop_config.json',
    cursor: './.cursorrules',
    openai: './.openai/config.json'
  };
  return paths[tool] || 'unknown';
}

app.listen(PORT, () => {
  console.log(chalk.green(`🖥️  UI 控制台启动在端口 ${PORT}`));
  console.log(chalk.gray(`访问地址: http://localhost:${PORT}`));
});
