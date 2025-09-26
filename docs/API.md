# meteor-shower API 文档

## 概述

meteor-shower 提供了丰富的 API 接口，支持配置管理、模板操作、监控数据获取等功能。本文档详细介绍了所有可用的 API 端点及其使用方法。

## 基础信息

- **基础 URL**: `http://localhost:3000` (Cloud Hub) / `http://localhost:3001` (UI 控制台)
- **API 版本**: v1
- **响应格式**: JSON
- **字符编码**: UTF-8

## 认证

目前 API 支持基础的 token 认证（企业版功能）：

```http
Authorization: Bearer your-access-token
```

## 通用响应格式

所有 API 响应都遵循以下格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-09-26T10:30:00.000Z"
}
```

错误响应格式：

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE",
  "timestamp": "2024-09-26T10:30:00.000Z"
}
```

## Cloud Hub API (端口 3000)

### 模板管理

#### 获取模板列表

```http
GET /api/v1/templates
```

**查询参数:**
- `tool` (可选): 按工具类型过滤 (`gemini`, `claude`, `cursor`, `openai`)
- `limit` (可选): 限制返回数量，默认 50
- `offset` (可选): 分页偏移量，默认 0

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "gemini-basic",
      "name": "Gemini 基础模板",
      "version": "1.0.0",
      "targets": ["gemini"],
      "variables": {
        "projectName": "my-project",
        "persona": "你是一名严谨的全栈工程师"
      },
      "createdAt": "2024-09-26T10:00:00.000Z",
      "updatedAt": "2024-09-26T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### 上传模板

```http
POST /api/v1/templates
```

**请求体:**
```json
{
  "id": "my-template",
  "name": "我的模板",
  "version": "1.0.0",
  "targets": ["gemini", "claude"],
  "variables": {
    "projectName": "default-project",
    "persona": "默认角色描述"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "my-template",
    "name": "我的模板",
    "version": "1.0.0",
    "createdAt": "2024-09-26T10:30:00.000Z"
  },
  "message": "模板上传成功"
}
```

#### 获取单个模板

```http
GET /api/v1/templates/{id}
```

**路径参数:**
- `id`: 模板 ID

#### 更新模板

```http
PUT /api/v1/templates/{id}
```

#### 删除模板

```http
DELETE /api/v1/templates/{id}
```

### 健康检查

#### 服务健康状态

```http
GET /health
```

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": "2024-09-26T10:30:00.000Z",
  "version": "0.1.0",
  "uptime": 3600
}
```

## UI 控制台 API (端口 3001)

### 配置管理

#### 获取配置列表

```http
GET /api/configs
```

**响应示例:**
```json
{
  "success": true,
  "configs": [
    {
      "id": "config-1",
      "name": "Gemini 开发配置",
      "tool": "gemini",
      "status": "active",
      "lastModified": "2024-09-26T10:30:00.000Z",
      "description": "用于日常开发的 Gemini 配置"
    }
  ]
}
```

#### 创建配置

```http
POST /api/configs
```

**请求体:**
```json
{
  "name": "新配置",
  "tool": "gemini",
  "template": "basic",
  "description": "配置描述",
  "variables": {
    "projectName": "my-project",
    "persona": "AI 角色描述"
  }
}
```

#### 更新配置

```http
PUT /api/configs/{id}
```

#### 删除配置

```http
DELETE /api/configs/{id}
```

#### 生成配置

```http
POST /api/generate-config
```

**请求体:**
```json
{
  "tools": ["gemini", "claude"],
  "template": "basic",
  "projectName": "my-project",
  "persona": "AI 角色描述"
}
```

**响应示例:**
```json
{
  "success": true,
  "config": {
    "tools": ["gemini", "claude"],
    "template": "basic",
    "projectName": "my-project",
    "persona": "AI 角色描述",
    "operations": [
      {
        "target": "gemini",
        "path": "~/.gemini/GEMINI.md",
        "kind": "create"
      }
    ]
  }
}
```

#### 应用配置

```http
POST /api/apply-config
```

**请求体:**
```json
{
  "config": {
    "tools": ["gemini"],
    "template": "basic",
    "operations": [...]
  },
  "dryRun": false
}
```

### 监控数据

#### 获取系统指标

```http
GET /api/metrics
```

**响应示例:**
```json
{
  "success": true,
  "metrics": {
    "cpu": 25,
    "memory": 45,
    "activeSessions": 8,
    "responseTime": 120,
    "errorRate": 2
  }
}
```

#### 获取服务状态

```http
GET /api/services
```

**响应示例:**
```json
{
  "success": true,
  "services": [
    {
      "name": "Cloud Hub API",
      "status": "online",
      "port": "3000",
      "latency": "12ms"
    },
    {
      "name": "UI 控制台",
      "status": "online",
      "port": "3001",
      "latency": "8ms"
    }
  ]
}
```

#### MCP 服务状态

```http
GET /api/mcp-status
```

### 国际化

#### 获取翻译

```http
GET /api/i18n/{locale}
```

**路径参数:**
- `locale`: 语言代码 (`zh-CN`, `en-US`, `ja-JP`, `ko-KR`)

**响应示例:**
```json
{
  "app.welcome": "欢迎使用 meteor-shower",
  "commands.init.generating": "正在生成配置...",
  "ui.dashboard.title": "控制台"
}
```

#### 获取支持的语言

```http
GET /api/i18n/locales
```

**响应示例:**
```json
{
  "success": true,
  "locales": [
    {
      "code": "zh-CN",
      "name": "Chinese (Simplified)",
      "nativeName": "简体中文"
    },
    {
      "code": "en-US",
      "name": "English (United States)",
      "nativeName": "English"
    }
  ]
}
```

## 错误代码

| 错误代码 | HTTP 状态码 | 描述 |
|---------|------------|------|
| `TEMPLATE_NOT_FOUND` | 404 | 模板不存在 |
| `INVALID_TEMPLATE` | 400 | 模板格式无效 |
| `CONFIG_NOT_FOUND` | 404 | 配置不存在 |
| `INVALID_CONFIG` | 400 | 配置格式无效 |
| `PERMISSION_DENIED` | 403 | 权限不足 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

## 限制和配额

- API 请求频率限制：每分钟 100 次请求
- 模板文件大小限制：最大 1MB
- 并发连接数限制：最大 50 个并发连接

## SDK 和客户端库

### Node.js

```bash
npm install @meteor-shower/client
```

```javascript
import { MeteorShowerClient } from '@meteor-shower/client';

const client = new MeteorShowerClient({
  baseURL: 'http://localhost:3000',
  token: 'your-access-token'
});

// 获取模板列表
const templates = await client.templates.list();

// 创建配置
const config = await client.configs.create({
  name: '新配置',
  tool: 'gemini',
  template: 'basic'
});
```

### cURL 示例

```bash
# 获取模板列表
curl -X GET http://localhost:3000/api/v1/templates

# 上传模板
curl -X POST http://localhost:3000/api/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-template",
    "name": "我的模板",
    "version": "1.0.0",
    "targets": ["gemini"]
  }'

# 生成配置
curl -X POST http://localhost:3001/api/generate-config \
  -H "Content-Type: application/json" \
  -d '{
    "tools": ["gemini"],
    "template": "basic",
    "projectName": "my-project"
  }'
```

## 变更日志

### v0.1.0 (2024-09-26)
- 初始 API 版本
- 支持模板管理、配置管理、监控数据获取
- 添加国际化支持
- 企业级认证和权限管理

## 支持和反馈

如有疑问或建议，请通过以下方式联系我们：

- GitHub Issues: https://github.com/meteor-shower/meteor-shower/issues
- 邮箱: support@meteor-shower.com
- 文档: https://docs.meteor-shower.com