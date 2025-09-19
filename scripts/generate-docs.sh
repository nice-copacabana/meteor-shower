#!/bin/bash
set -e

echo "�� 生成项目文档"
echo "================"

# 创建文档目录
mkdir -p docs/api docs/guides docs/examples

# 生成 API 文档
echo "🔧 生成 API 文档..."
cat > docs/api/cli.md << 'EOF'
# CLI API 文档

## 命令列表

### ms init
初始化 meteor-shower 配置

**选项:**
- `--toolset`: 指定工具集
- `--template`: 指定模板
- `--variables`: 指定变量

**示例:**
```bash
ms init
ms init --toolset gemini,claude --template basic
```

### ms diff
对比渲染结果与当前环境差异

**选项:**
- `--verbose`: 详细输出
- `--json`: JSON 格式输出

**示例:**
```bash
ms diff
ms diff --verbose
```

### ms apply
应用配置并支持回滚

**选项:**
- `-y, --yes`: 跳过确认
- `--dry-run`: 模拟运行

**示例:**
```bash
ms apply
ms apply --yes
ms apply --dry-run
```

### ms share
将当前项目规则打包为模板

**选项:**
- `--name`: 模板名称
- `--description`: 模板描述

**示例:**
```bash
ms share
ms share --name my-template --description "My custom template"
```

### ms mcp test
探测 MCP 服务可用性

**选项:**
- `--timeout`: 超时时间（秒）
- `--verbose`: 详细输出

**示例:**
```bash
ms mcp test
ms mcp test --timeout 10
```
