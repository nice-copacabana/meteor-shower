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
app.post('/api/generate-config', (req, res) => {
    const { tools, template, projectName, persona } = req.body;
    // 模拟配置生成
    const config = {
        tools,
        template,
        projectName,
        persona,
        operations: tools.map((tool) => ({
            target: tool,
            path: getConfigPath(tool),
            kind: 'create'
        }))
    };
    res.json({
        success: true,
        config
    });
});
app.post('/api/apply-config', (req, res) => {
    const { config } = req.body;
    // 模拟配置应用
    setTimeout(() => {
        res.json({
            success: true,
            message: '配置应用成功',
            applied: config.operations.length
        });
    }, 1000);
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
function getConfigPath(tool) {
    const paths = {
        gemini: '~/.gemini/GEMINI.md',
        claude: '~/.claude/claude.json',
        cursor: './.cursor/rules.txt',
        openai: './AGENTS.md'
    };
    return paths[tool] || 'unknown';
}
app.listen(PORT, () => {
    console.log(chalk.green(`🖥️  UI 控制台启动在端口 ${PORT}`));
    console.log(chalk.gray(`访问地址: http://localhost:${PORT}`));
});
