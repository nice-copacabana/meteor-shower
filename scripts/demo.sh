#!/usr/bin/env bash
set -euo pipefail

echo "🚀 meteor-shower 演示脚本"
echo "========================="

# 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 需要安装 Node.js"
  exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 演示 CLI 命令
echo ""
echo "🎯 演示 CLI 命令:"
echo ""

echo "1. 显示帮助信息:"
node packages/cli/dist/index.js --help

echo ""
echo "2. 演示 diff 命令:"
node packages/cli/dist/index.js diff

echo ""
echo "3. 演示 mcp test 命令:"
node packages/cli/dist/index.js mcp test

echo ""
echo "✅ 演示完成！"
echo "💡 运行 'node packages/cli/dist/index.js init' 开始交互式配置"
