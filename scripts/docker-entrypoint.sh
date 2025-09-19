#!/bin/bash
set -e

echo "🐳 meteor-shower Docker 容器启动"
echo "================================="

# 启动 Cloud Hub
echo "☁️  启动 Cloud Hub..."
cd packages/cloud-hub
npm start &
CLOUD_PID=$!

# 启动 UI 控制台
echo "🖥️  启动 UI 控制台..."
cd ../ui
npm start &
UI_PID=$!

# 启动 RAG 服务器
echo "🔍 启动 RAG 服务器..."
cd ../../examples/rag-server
npm start &
RAG_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

echo "✅ 所有服务已启动！"
echo "📊 服务地址:"
echo "  - Cloud Hub: http://localhost:3000"
echo "  - UI 控制台: http://localhost:3001"
echo "  - RAG 服务器: http://localhost:3002"

# 保持容器运行
wait
