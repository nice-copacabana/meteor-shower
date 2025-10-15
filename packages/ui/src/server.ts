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
app.use(express.json());

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/monitoring-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/monitoring-dashboard.html'));
});

app.get('/config-manager', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/config-manager.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pricing.html'));
});

app.get('/upgrade', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/upgrade.html'));
});

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
    operations: tools.map((tool: string) => ({
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

// 配置管理 API
app.get('/api/configs', (req, res) => {
  // 模拟获取配置列表
  const configs = [
    {
      id: 'config-1',
      name: 'Gemini 开发配置',
      tool: 'gemini',
      status: 'active',
      lastModified: new Date().toISOString(),
      description: '用于日常开发的 Gemini 配置'
    },
    {
      id: 'config-2', 
      name: 'Claude 写作助手',
      tool: 'claude',
      status: 'inactive',
      lastModified: new Date().toISOString(),
      description: '专用于技术写作的 Claude 配置'
    }
  ];
  
  res.json({ success: true, configs });
});

app.post('/api/configs', (req, res) => {
  // 模拟创建新配置
  const { name, tool, template, description } = req.body;
  
  const newConfig = {
    id: 'config-' + Date.now(),
    name,
    tool,
    template,
    status: 'pending',
    lastModified: new Date().toISOString(),
    description
  };
  
  res.json({ success: true, config: newConfig });
});

app.put('/api/configs/:id', (req, res) => {
  // 模拟更新配置
  const { id } = req.params;
  const updates = req.body;
  
  res.json({ 
    success: true, 
    message: `配置 ${id} 更新成功`,
    config: { id, ...updates }
  });
});

app.delete('/api/configs/:id', (req, res) => {
  // 模拟删除配置
  const { id } = req.params;
  
  res.json({ 
    success: true, 
    message: `配置 ${id} 删除成功`
  });
});

// 监控数据 API
app.get('/api/metrics', (req, res) => {
  // 模拟系统指标
  const metrics = {
    cpu: Math.floor(Math.random() * 30 + 20),
    memory: Math.floor(Math.random() * 40 + 30),
    activeSessions: Math.floor(Math.random() * 20 + 5),
    responseTime: Math.floor(Math.random() * 100 + 50),
    errorRate: Math.floor(Math.random() * 5 + 1)
  };
  
  res.json({ success: true, metrics });
});

// 国际化 API
app.get('/api/i18n/:locale', (req, res) => {
  const { locale } = req.params;
  
  // 模拟翻译文件加载
  const translations = {
    'zh-CN': {
      'app.welcome': '欢迎使用 meteor-shower',
      'commands.init.generating': '正在生成配置...',
      'commands.init.success': '配置生成成功',
      'commands.apply.applying': '正在应用配置...',
      'commands.apply.success': '配置应用成功！',
      'ui.dashboard.title': '控制台',
      'ui.monitoring.serviceStatus': '服务状态检查',
      'ui.monitoring.online': '在线',
      'ui.monitoring.warning': '警告'
    },
    'en-US': {
      'app.welcome': 'Welcome to meteor-shower',
      'commands.init.generating': 'Generating configuration...',
      'commands.init.success': 'Configuration generated successfully',
      'commands.apply.applying': 'Applying configuration...',
      'commands.apply.success': 'Configuration applied successfully!',
      'ui.dashboard.title': 'Console',
      'ui.monitoring.serviceStatus': 'Service status check',
      'ui.monitoring.online': 'Online',
      'ui.monitoring.warning': 'Warning'
    },
    'ja-JP': {
      'app.welcome': 'meteor-showerへようこそ',
      'commands.init.generating': '設定を生成中...',
      'commands.init.success': '設定が正常に生成されました',
      'commands.apply.applying': '設定を適用中...',
      'commands.apply.success': '設定が正常に適用されました！',
      'ui.dashboard.title': 'コンソール',
      'ui.monitoring.serviceStatus': 'サービス状態確認',
      'ui.monitoring.online': 'オンライン',
      'ui.monitoring.warning': '警告'
    },
    'ko-KR': {
      'app.welcome': 'meteor-shower에 오신 것을 환영합니다',
      'commands.init.generating': '구성 생성 중...',
      'commands.init.success': '구성이 성공적으로 생성되었습니다',
      'commands.apply.applying': '구성 적용 중...',
      'commands.apply.success': '구성이 성공적으로 적용되었습니다!',
      'ui.dashboard.title': '콘솔',
      'ui.monitoring.serviceStatus': '서비스 상태 확인',
      'ui.monitoring.online': '온라인',
      'ui.monitoring.warning': '경고'
    }
  };
  
  const translation = translations[locale] || translations['en-US'];
  res.json(translation);
});

app.get('/api/i18n/locales', (req, res) => {
  // 返回支持的语言列表
  const locales = [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'en-US', name: 'English (United States)', nativeName: 'English' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' }
  ];
  
  res.json({ success: true, locales });
});

function getConfigPath(tool: string): string {
  const paths: Record<string, string> = {
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
