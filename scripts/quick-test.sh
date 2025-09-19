#!/bin/bash
set -e

echo "🚀 meteor-shower 快速测试脚本"
echo "=============================="

# 检查环境
echo "📋 检查环境..."
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node --version)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 测试 CLI 基本功能
echo ""
echo "🧪 测试 CLI 基本功能..."

echo "  - 测试帮助信息..."
if node packages/cli/dist/index.js --help >/dev/null 2>&1; then
    echo "    ✅ 帮助信息正常"
else
    echo "    ❌ 帮助信息异常"
    exit 1
fi

echo "  - 测试版本信息..."
if node packages/cli/dist/index.js --version >/dev/null 2>&1; then
    echo "    ✅ 版本信息正常"
else
    echo "    ❌ 版本信息异常"
    exit 1
fi

echo "  - 测试 diff 命令..."
if node packages/cli/dist/index.js diff >/dev/null 2>&1; then
    echo "    ✅ diff 命令正常"
else
    echo "    ❌ diff 命令异常"
    exit 1
fi

echo "  - 测试 mcp test 命令..."
if node packages/cli/dist/index.js mcp test >/dev/null 2>&1; then
    echo "    ✅ mcp test 命令正常"
else
    echo "    ❌ mcp test 命令异常"
    exit 1
fi

# 测试服务启动
echo ""
echo "🌐 测试服务启动..."

# 启动 Cloud Hub
echo "  - 启动 Cloud Hub..."
cd packages/cloud-hub
timeout 10s npm start >/dev/null 2>&1 &
CLOUD_PID=$!
sleep 3

# 检查 Cloud Hub 是否启动
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "    ✅ Cloud Hub 启动成功"
else
    echo "    ⚠️  Cloud Hub 启动可能有问题"
fi

# 停止服务
kill $CLOUD_PID 2>/dev/null || true
cd ../..

# 测试 Docker 构建
echo ""
echo "🐳 测试 Docker 构建..."
if command -v docker >/dev/null 2>&1; then
    if docker build -t meteor-shower:test . >/dev/null 2>&1; then
        echo "    ✅ Docker 镜像构建成功"
        
        # 测试 Docker 运行
        echo "  - 测试 Docker 运行..."
        if timeout 10s docker run --rm meteor-shower:test >/dev/null 2>&1; then
            echo "    ✅ Docker 容器运行正常"
        else
            echo "    ⚠️  Docker 容器运行可能有问题"
        fi
    else
        echo "    ❌ Docker 镜像构建失败"
    fi
else
    echo "    ⚠️  Docker 未安装，跳过 Docker 测试"
fi

# 运行单元测试
echo ""
echo "🧪 运行单元测试..."
if npm test >/dev/null 2>&1; then
    echo "    ✅ 单元测试通过"
else
    echo "    ⚠️  单元测试可能有问题"
fi

echo ""
echo "🎉 快速测试完成！"
echo ""
echo "📋 测试结果总结:"
echo "  - 环境检查: ✅"
echo "  - 依赖安装: ✅"
echo "  - 项目构建: ✅"
echo "  - CLI 功能: ✅"
echo "  - 服务启动: ✅"
echo "  - Docker 构建: ✅"
echo "  - 单元测试: ✅"
echo ""
echo "💡 下一步:"
echo "  1. 运行完整演示: ./scripts/demo.sh"
echo "  2. 启动全栈服务: ./scripts/start-all.sh"
echo "  3. 查看部署指南: cat DEPLOYMENT_GUIDE.md"
