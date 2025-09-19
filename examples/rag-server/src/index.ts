import express from 'express';
import chalk from 'chalk';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// 模拟向量数据库
const vectors: Array<{ id: string; content: string; embedding: number[] }> = [];

// 添加文档
app.post('/api/vectors', (req, res) => {
  const { content } = req.body;
  const id = `doc_${Date.now()}`;
  const embedding = Array.from({ length: 384 }, () => Math.random());
  
  vectors.push({ id, content, embedding });
  
  res.json({
    success: true,
    id,
    message: '文档已添加到向量数据库'
  });
});

// 搜索相似文档
app.post('/api/search', (req, res) => {
  const { query, topK = 5 } = req.body;
  
  // 简单的相似度计算（实际应使用真正的向量相似度）
  const results = vectors
    .map(v => ({
      id: v.id,
      content: v.content,
      score: Math.random() // 模拟相似度分数
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  res.json({
    success: true,
    query,
    results,
    total: results.length
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    vectors: vectors.length,
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(chalk.green(`🔍 RAG 服务器启动在端口 ${PORT}`));
  console.log(chalk.gray(`健康检查: http://localhost:${PORT}/health`));
  console.log(chalk.gray(`向量数量: ${vectors.length}`));
});
