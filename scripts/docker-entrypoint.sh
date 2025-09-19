#!/bin/sh
set -e

echo "🚀 启动 meteor-shower 服务..."

# 检查必要文件是否存在
if [ ! -d "packages/cloud-hub/dist" ]; then
    echo "❌ Cloud Hub 构建文件不存在，请先运行 npm run build"
    exit 1
fi

# 启动 Cloud Hub
echo "☁️  启动 Cloud Hub..."
cd packages/cloud-hub
node dist/index.js &
CLOUD_PID=$!

# 启动 UI Console
echo "🖥️  启动 UI Console..."
cd ../ui
node dist/server.js &
UI_PID=$!

# 启动 RAG Server
echo "🧠 启动 RAG Server..."
cd ../../examples/rag-server
node dist/index.js &
RAG_PID=$!

# 等待所有服务启动
sleep 5

echo "✅ 所有服务已启动！"
echo "Cloud Hub: http://localhost:3000"
echo "UI Console: http://localhost:3001"
echo "RAG Server: http://localhost:3002"

# 保持容器运行
wait $CLOUD_PID $UI_PID $RAG_PID
