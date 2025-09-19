#!/bin/sh
set -e

echo "🚀 启动 meteor-shower 服务..."

# 启动 Cloud Hub
echo "☁️  启动 Cloud Hub..."
cd packages/cloud-hub
npm start &
CLOUD_PID=$!

# 启动 UI Console
echo "🖥️  启动 UI Console..."
cd ../ui
npm start &
UI_PID=$!

# 启动 RAG Server
echo "🧠 启动 RAG Server..."
cd ../../examples/rag-server
npm start &
RAG_PID=$!

# 等待所有服务启动
sleep 5

echo "✅ 所有服务已启动！"
echo "Cloud Hub: http://localhost:3000"
echo "UI Console: http://localhost:3001"
echo "RAG Server: http://localhost:3002"

# 保持容器运行
wait $CLOUD_PID $UI_PID $RAG_PID
