/**
 * Cloud Hub - 云端模板共享服务
 *
 * 功能特性：
 * - 模板上传和存储
 * - 模板检索和过滤
 * - 模板评分和分享
 * - RESTful API 接口
 */

import express from 'express';               // Express.js Web框架
import cors from 'cors';                     // 跨域资源共享
import chalk from 'chalk';                   // 终端颜色输出

// 创建Express应用实例
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());                            // 启用CORS跨域支持
app.use(express.json());                    // 解析JSON请求体

// 内存存储（生产环境建议使用数据库如MongoDB、PostgreSQL等）
const templates: any[] = [];

// ========== API路由定义 ==========

/**
 * 获取模板列表
 * GET /api/v1/templates
 *
 * 查询参数：
 * - tool: 按工具类型过滤（可选）
 *
 * 响应格式：
 * {
 *   success: boolean,
 *   data: Template[],
 *   total: number
 * }
 */
app.get('/api/v1/templates', (req, res) => {
  const { tool } = req.query;

  // 根据工具类型过滤模板
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

/**
 * 上传模板
 * POST /api/v1/templates
 *
 * 请求体：模板对象
 * 必需字段：id, name, targets
 *
 * 响应格式：
 * {
 *   success: boolean,
 *   data: Template,
 *   message: string
 * }
 */
app.post('/api/v1/templates', (req, res) => {
  const template = req.body;

  // 基础验证
  if (!template.id || !template.name || !template.targets) {
    return res.status(400).json({
      success: false,
      error: '模板格式无效'
    });
  }

  // 处理模板存储逻辑
  const existingIndex = templates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    // 更新现有模板
    templates[existingIndex] = { ...template, updatedAt: new Date() };
  } else {
    // 创建新模板
    templates.push({ ...template, createdAt: new Date() });
  }

  res.json({
    success: true,
    data: template,
    message: '模板上传成功'
  });
});

/**
 * 健康检查端点
 * GET /health
 *
 * 返回服务健康状态和时间戳
 * 用于监控和负载均衡健康检查
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== 服务启动 ==========

/**
 * 启动HTTP服务器
 * 监听指定端口，启动Cloud Hub服务
 */
app.listen(PORT, () => {
  console.log(chalk.green(`🚀 Cloud Hub 服务启动在端口 ${PORT}`));
  console.log(chalk.gray(`健康检查: http://localhost:${PORT}/health`));
  console.log(chalk.gray(`API 文档: http://localhost:${PORT}/api/v1/templates`));
});
