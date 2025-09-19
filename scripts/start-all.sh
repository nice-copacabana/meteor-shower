#!/usr/bin/env bash
set -euo pipefail

echo "🚀 启动 meteor-shower 全栈服务"
echo "================================"

# 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 需要安装 Node.js"
  exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建所有包
echo "🔨 构建项目..."
npm run build

# 启动 Cloud Hub
echo "☁️  启动 Cloud Hub..."
cd packages/cloud-hub
npm run start &
CLOUD_PID=$!

# 等待 Cloud Hub 启动
sleep 2

# 启动 RAG 服务器
echo "🔍 启动 RAG 服务器..."
cd ../../examples/rag-server
npm run start &
RAG_PID=$!

# 等待 RAG 服务器启动
sleep 2

echo ""
echo "✅ 所有服务已启动！"
echo "📊 服务状态:"
echo "  - Cloud Hub: http://localhost:3000"
echo "  - RAG 服务器: http://localhost:3002"
echo ""
echo "💡 按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $CLOUD_PID $RAG_PID 2>/dev/null; exit 0" INT
wait
