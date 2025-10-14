# 示例模板库

本目录包含预定义的AI工具配置模板，帮助您快速开始不同类型的项目开发。

## 可用模板

### 1. Full-Stack App（全栈应用开发）
**文件**: `full-stack-app.json`

**适用场景**:
- React/Vue + Node.js 全栈Web应用
- RESTful API后端服务
- 企业级应用开发
- SaaS产品开发

**技术栈**:
- 前端：React, TypeScript
- 后端：Node.js, Express
- 数据库：PostgreSQL, Redis
- 工具：Docker, Jest

**支持工具**: Gemini, Claude, Cursor

**特点**:
- 严格的TypeScript类型检查
- 80%测试覆盖率要求
- SOLID原则和Clean Architecture
- 完整的安全性要求

**适合人群**: 中级到高级全栈开发者

---

### 2. AI Assistant（AI助手应用）
**文件**: `ai-assistant.json`

**适用场景**:
- AI对话机器人
- 智能客服系统
- 知识库问答助手
- AI Agent应用

**技术栈**:
- 语言：Python
- 框架：FastAPI, LangChain
- 向量数据库：Pinecone
- LLM：OpenAI, Claude, Gemini

**支持工具**: Gemini, Claude, OpenAI

**特点**:
- 多模态支持（文本+图像）
- RAG检索增强生成
- 提示工程最佳实践
- 完整的安全防护

**适合人群**: AI应用开发者、提示工程师

---

### 3. Data Science（数据科学与ML）
**文件**: `data-science.json`

**适用场景**:
- 数据分析和可视化
- 机器学习模型开发
- 深度学习实验
- 预测性分析

**技术栈**:
- 语言：Python
- 数据处理：Pandas, NumPy
- 机器学习：Scikit-learn, PyTorch
- 可视化：Matplotlib, Seaborn

**支持工具**: Claude, Cursor, OpenAI

**特点**:
- 完整的数据分析工作流
- 可复现性保证
- MLOps最佳实践
- 模型可解释性

**适合人群**: 数据科学家、ML工程师

---

## 使用方法

### 方式1: 通过CLI使用

```bash
# 初始化配置时选择对应的模板
ms init

# 在模板选择环节，会看到这些预定义模板
```

### 方式2: 直接加载模板

```bash
# 使用特定模板初始化
ms init --template full-stack-app

# 或者
ms init --template ai-assistant
ms init --template data-science
```

### 方式3: 自定义修改

1. 复制现有模板文件
2. 根据您的需求修改配置
3. 使用自定义模板初始化

```bash
# 复制模板
cp full-stack-app.json my-custom-template.json

# 编辑模板
# ... 修改配置 ...

# 使用自定义模板
ms init --template ./my-custom-template.json
```

## 模板结构说明

每个模板包含以下关键部分：

```json
{
  "id": "模板唯一标识符",
  "name": "模板显示名称",
  "description": "模板详细描述",
  "version": "模板版本号",
  "category": "模板分类",
  "targets": ["支持的AI工具列表"],
  "variables": {
    // 配置变量
    "projectName": "项目名称",
    "persona": "AI角色定义",
    "codingRules": ["编码规范"],
    // ... 更多变量
  },
  "tags": ["标签列表"],
  "metadata": {
    "author": "作者",
    "difficulty": "难度级别",
    "estimatedSetupTime": "预计配置时间"
  }
}
```

## 模板定制指南

### 修改AI模型

```json
"variables": {
  "geminiModel": "gemini-2.0-flash-exp",  // 修改为所需模型
  "claudeModel": "claude-3-5-sonnet-20241022",
  "temperature": 0.2  // 调整创造性（0-2）
}
```

### 调整编码规范

```json
"codingRules": [
  "自定义规则1",
  "自定义规则2"
]
```

### 修改技术栈

```json
"techStack": [
  "你的技术1",
  "你的技术2"
]
```

## 创建新模板

1. 复制现有模板作为起点
2. 修改 `id`, `name`, `description`
3. 调整 `targets` 列表
4. 自定义 `variables`
5. 添加适当的 `tags`
6. 更新 `metadata`

## 模板最佳实践

### 1. 变量命名
- 使用驼峰命名法
- 名称要具有描述性
- 避免使用缩写

### 2. Persona定义
- 清晰定义AI角色和专长
- 指定期望的行为和输出风格
- 包含相关领域知识背景

### 3. 编码规范
- 具体而非笼统
- 可执行和可验证
- 符合行业标准

### 4. 技术栈
- 列出核心依赖
- 包含版本要求（如需要）
- 保持列表简洁

## 贡献新模板

欢迎贡献新的模板！请遵循以下步骤：

1. Fork项目仓库
2. 创建新的模板文件
3. 确保模板符合结构要求
4. 添加详细的描述和使用说明
5. 提交Pull Request

## 常见问题

**Q: 可以同时使用多个模板吗？**
A: 不可以，每次初始化只能选择一个模板。但您可以合并多个模板的配置。

**Q: 如何更新现有配置？**
A: 运行 `ms init` 重新初始化，或手动编辑 `.meteor-shower/config-plan.json`。

**Q: 模板支持哪些AI工具？**
A: 目前支持 Gemini、Claude、Cursor 和 OpenAI。具体支持情况见各模板的 `targets` 字段。

**Q: 可以创建团队共享的模板吗？**
A: 可以！将模板文件提交到团队代码仓库，团队成员可以通过文件路径加载。

## 相关文档

- [CLI使用指南](../../../docs/CLI_GUIDE.md)
- [模板Schema文档](../schemas/template-schema.json)
- [适配器开发指南](../../../docs/ADAPTER_GUIDE.md)

---

**生成工具**: Qoder AI (Model: claude-sonnet-4-20250514)  
**生成日期**: 2025-10-14  
**维护者**: meteor-shower团队
