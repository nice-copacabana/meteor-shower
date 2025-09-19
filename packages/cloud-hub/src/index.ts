import express from 'express';
import cors from 'cors';
import chalk from 'chalk';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 模板存储（内存，生产环境应使用数据库）
const templates: any[] = [];

// 获取模板列表
app.get('/api/v1/templates', (req, res) => {
  const { tool } = req.query;
  
  let filteredTemplates = templates;
  if (tool) {
    filteredTemplates = templates.filter(t => t.targets.includes(tool));
  }
  
  res.json({
    success: true,
    data: filteredTemplates,
    total: filteredTemplates.length
  });
});

// 上传模板
app.post('/api/v1/templates', (req, res) => {
  const template = req.body;
  
  // 简单验证
  if (!template.id || !template.name || !template.targets) {
    return res.status(400).json({
      success: false,
      error: '模板格式无效'
    });
  }
  
  // 检查是否已存在
  const existingIndex = templates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    templates[existingIndex] = { ...template, updatedAt: new Date() };
  } else {
    templates.push({ ...template, createdAt: new Date() });
  }
  
  res.json({
    success: true,
    data: template,
    message: '模板上传成功'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(chalk.green(`🚀 Cloud Hub 服务启动在端口 ${PORT}`));
  console.log(chalk.gray(`健康检查: http://localhost:${PORT}/health`));
  console.log(chalk.gray(`API 文档: http://localhost:${PORT}/api/v1/templates`));
});
