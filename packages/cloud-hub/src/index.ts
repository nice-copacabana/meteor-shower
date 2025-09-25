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
import fs from 'fs/promises';                // 文件系统操作
import path from 'path';                     // 路径操作

// 创建Express应用实例
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());                            // 启用CORS跨域支持
app.use(express.json());                    // 解析JSON请求体

// 数据存储配置
const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

// 模板存储接口
interface Template {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  targets: string[];
  variables: Record<string, string>;
  files: Array<{
    path: string;
    target: string;
    content: string;
    description: string;
  }>;
  created: string;
  updated?: string;
  rating?: number;
  downloadCount?: number;
  tags?: string[];
}

// 初始化数据存储
let templates: Template[] = [];
async function initializeDataStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 检查模板文件是否存在
    try {
      const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
      templates = JSON.parse(data);
      console.log(chalk.gray(`📁 加载了 ${templates.length} 个模板`));
    } catch {
      // 文件不存在，创建空的模板数组
      templates = [];
      await saveTemplates();
      console.log(chalk.gray('📁 创建了新的模板存储文件'));
    }
  } catch (error) {
    console.error(chalk.red('❌ 数据存储初始化失败:'), error);
  }
}

// 保存模板到文件
async function saveTemplates() {
  try {
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error(chalk.red('❌ 保存模板失败:'), error);
    throw error;
  }
}

// ========== API路由定义 ==========

/**
 * 获取模板列表
 * GET /api/v1/templates
 *
 * 查询参数：
 * - tool: 按工具类型过滤（可选）
 * - author: 按作者过滤（可选）
 * - tag: 按标签过滤（可选）
 * - sort: 排序方式 (rating, created, updated, downloads)
 * - limit: 限制返回数量
 * - offset: 分页偏移
 *
 * 响应格式：
 * {
 *   success: boolean,
 *   data: Template[],
 *   total: number,
 *   pagination: { limit, offset, hasMore }
 * }
 */
app.get('/api/v1/templates', async (req, res) => {
  try {
    const { tool, author, tag, sort = 'created', limit = 50, offset = 0 } = req.query;

    let filteredTemplates = [...templates];

    // 应用过滤器
    if (tool) {
      filteredTemplates = filteredTemplates.filter(t => t.targets.includes(tool as string));
    }
    if (author) {
      filteredTemplates = filteredTemplates.filter(t => t.author === author);
    }
    if (tag) {
      filteredTemplates = filteredTemplates.filter(t => t.tags?.includes(tag as string));
    }

    // 应用排序
    filteredTemplates.sort((a, b) => {
      switch (sort) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'downloads':
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        case 'updated':
          return new Date(b.updated || b.created).getTime() - new Date(a.updated || a.created).getTime();
        case 'created':
        default:
          return new Date(b.created).getTime() - new Date(a.created).getTime();
      }
    });

    // 分页
    const total = filteredTemplates.length;
    const paginatedTemplates = filteredTemplates.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    res.json({
      success: true,
      data: paginatedTemplates,
      total,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取模板列表失败'
    });
  }
});

/**
 * 获取单个模板详情
 * GET /api/v1/templates/:id
 */
app.get('/api/v1/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = templates.find(t => t.id === id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取模板详情失败'
    });
  }
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
app.post('/api/v1/templates', async (req, res) => {
  try {
    const template = req.body;

    // 基础验证
    if (!template.id || !template.name || !template.targets) {
      return res.status(400).json({
        success: false,
        error: '模板格式无效，必需字段：id, name, targets'
      });
    }

    // 处理模板存储逻辑
    const existingIndex = templates.findIndex(t => t.id === template.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // 更新现有模板
      templates[existingIndex] = {
        ...template,
        updated: now,
        downloadCount: templates[existingIndex].downloadCount || 0
      };
    } else {
      // 创建新模板
      const newTemplate: Template = {
        ...template,
        created: now,
        updated: now,
        rating: 0,
        downloadCount: 0,
        tags: template.tags || []
      };
      templates.push(newTemplate);
    }

    await saveTemplates();

    res.json({
      success: true,
      data: existingIndex >= 0 ? templates[existingIndex] : newTemplate,
      message: '模板上传成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '上传模板失败'
    });
  }
});

/**
 * 更新模板
 * PUT /api/v1/templates/:id
 */
app.put('/api/v1/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = req.body;

    const existingIndex = templates.findIndex(t => t.id === id);
    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 更新模板
    templates[existingIndex] = {
      ...templates[existingIndex],
      ...template,
      updated: new Date().toISOString()
    };

    await saveTemplates();

    res.json({
      success: true,
      data: templates[existingIndex],
      message: '模板更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新模板失败'
    });
  }
});

/**
 * 删除模板
 * DELETE /api/v1/templates/:id
 */
app.delete('/api/v1/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingIndex = templates.findIndex(t => t.id === id);
    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 删除模板
    templates.splice(existingIndex, 1);
    await saveTemplates();

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除模板失败'
    });
  }
});

/**
 * 模板评分
 * POST /api/v1/templates/:id/rate
 */
app.post('/api/v1/templates/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: '评分必须在1-5之间'
      });
    }

    const template = templates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 计算新的平均评分
    const currentRating = template.rating || 0;
    const currentCount = Math.floor((currentRating * 10)); // 估算当前评分次数
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    template.rating = Math.round(newRating * 10) / 10;
    template.updated = new Date().toISOString();

    await saveTemplates();

    res.json({
      success: true,
      data: template,
      message: '评分提交成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '评分提交失败'
    });
  }
});

/**
 * 下载模板
 * POST /api/v1/templates/:id/download
 */
app.post('/api/v1/templates/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const template = templates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 增加下载计数
    template.downloadCount = (template.downloadCount || 0) + 1;
    template.updated = new Date().toISOString();

    await saveTemplates();

    res.json({
      success: true,
      data: template,
      message: '下载计数已更新'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新下载计数失败'
    });
  }
});

/**
 * 获取模板统计信息
 * GET /api/v1/templates/stats/overview
 */
app.get('/api/v1/templates/stats/overview', async (req, res) => {
  try {
    const total = templates.length;
    const totalDownloads = templates.reduce((sum, t) => sum + (t.downloadCount || 0), 0);
    const averageRating = templates.reduce((sum, t) => sum + (t.rating || 0), 0) / total || 0;
    const tools = [...new Set(templates.flatMap(t => t.targets))];
    const authors = [...new Set(templates.map(t => t.author).filter(Boolean))];

    res.json({
      success: true,
      data: {
        total,
        totalDownloads,
        averageRating: Math.round(averageRating * 10) / 10,
        uniqueTools: tools.length,
        uniqueAuthors: authors.length,
        tools,
        authors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
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
async function startServer() {
  try {
    // 初始化数据存储
    await initializeDataStorage();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(chalk.green(`🚀 Cloud Hub 服务启动在端口 ${PORT}`));
      console.log(chalk.gray(`健康检查: http://localhost:${PORT}/health`));
      console.log(chalk.gray(`API 文档: http://localhost:${PORT}/api/v1/templates`));
      console.log(chalk.gray(`数据存储: ${DATA_DIR}`));
      console.log(chalk.gray(`模板数量: ${templates.length}`));
    });
  } catch (error) {
    console.error(chalk.red('❌ 启动Cloud Hub服务失败:'), error);
    process.exit(1);
  }
}

// 启动服务
startServer();
