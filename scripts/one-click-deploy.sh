#!/bin/bash
set -e

echo "🚀 meteor-shower 一键部署脚本"
echo "=============================="

# 检查环境
echo "📋 检查部署环境..."

# 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查 Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ 环境检查通过"

# 选择部署方式
echo ""
echo "🎯 选择部署方式:"
echo "1) 本地开发模式"
echo "2) Docker 单容器模式"
echo "3) Docker Compose 模式"
echo "4) Kubernetes 模式"
echo "5) 生产环境模式"

read -p "请选择 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔧 启动本地开发模式..."
        npm install
        npm run build
        
        echo "启动服务..."
        ./scripts/start-all.sh
        ;;
        
    2)
        echo ""
        echo "🐳 启动 Docker 单容器模式..."
        docker build -t meteor-shower:latest .
        
        echo "停止现有容器..."
        docker stop meteor-shower 2>/dev/null || true
        docker rm meteor-shower 2>/dev/null || true
        
        echo "启动新容器..."
        docker run -d \
            --name meteor-shower \
            -p 3000:3000 \
            -p 3001:3001 \
            -p 3002:3002 \
            meteor-shower:latest
        
        echo "等待服务启动..."
        sleep 10
        
        echo "检查服务状态..."
        if curl -s http://localhost:3000/health >/dev/null; then
            echo "✅ Cloud Hub 运行正常"
        else
            echo "❌ Cloud Hub 启动失败"
        fi
        
        if curl -s http://localhost:3001/api/status >/dev/null; then
            echo "✅ UI 控制台运行正常"
        else
            echo "❌ UI 控制台启动失败"
        fi
        
        echo ""
        echo "🎉 部署完成！"
        echo "访问地址:"
        echo "  - UI 控制台: http://localhost:3001"
        echo "  - Cloud Hub API: http://localhost:3000"
        echo "  - RAG 服务器: http://localhost:3002"
        ;;
        
    3)
        echo ""
        echo "🐳 启动 Docker Compose 模式..."
        docker-compose down 2>/dev/null || true
        docker-compose up -d
        
        echo "等待服务启动..."
        sleep 15
        
        echo "检查服务状态..."
        docker-compose ps
        
        echo ""
        echo "🎉 部署完成！"
        echo "访问地址:"
        echo "  - UI 控制台: http://localhost:3001"
        echo "  - Cloud Hub API: http://localhost:3000"
        echo "  - RAG 服务器: http://localhost:3002"
        ;;
        
    4)
        echo ""
        echo "☸️  启动 Kubernetes 模式..."
        
        # 检查 kubectl
        if ! command -v kubectl >/dev/null 2>&1; then
            echo "❌ kubectl 未安装，请先安装 kubectl"
            exit 1
        fi
        
        # 检查集群连接
        if ! kubectl cluster-info >/dev/null 2>&1; then
            echo "❌ 无法连接到 Kubernetes 集群"
            exit 1
        fi
        
        # 创建命名空间
        kubectl create namespace meteor-shower --dry-run=client -o yaml | kubectl apply -f -
        
        # 部署应用
        kubectl apply -f k8s/deployment.yaml -n meteor-shower
        
        echo "等待部署完成..."
        kubectl wait --for=condition=available --timeout=300s deployment/meteor-shower -n meteor-shower
        
        echo "获取服务信息..."
        kubectl get services -n meteor-shower
        
        echo ""
        echo "🎉 部署完成！"
        echo "使用以下命令访问服务:"
        echo "  kubectl port-forward service/meteor-shower-service 3000:3000 -n meteor-shower"
        echo "  kubectl port-forward service/meteor-shower-service 3001:3001 -n meteor-shower"
        echo "  kubectl port-forward service/meteor-shower-service 3002:3002 -n meteor-shower"
        ;;
        
    5)
        echo ""
        echo "�� 启动生产环境模式..."
        
        # 设置生产环境变量
        export NODE_ENV=production
        export PORT=3000
        export UI_PORT=3001
        
        # 安装依赖
        npm ci --only=production
        
        # 构建项目
        npm run build
        
        # 使用 PM2 管理进程
        if command -v pm2 >/dev/null 2>&1; then
            echo "使用 PM2 启动服务..."
            pm2 start ecosystem.config.js
            pm2 save
            pm2 startup
        else
            echo "PM2 未安装，使用 Docker Compose 启动..."
            docker-compose -f docker-compose.prod.yml up -d
        fi
        
        echo ""
        echo "🎉 生产环境部署完成！"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📋 部署后操作:"
echo "1. 检查服务状态: curl http://localhost:3000/health"
echo "2. 访问 UI 控制台: http://localhost:3001"
echo "3. 查看日志: docker logs meteor-shower (Docker 模式)"
echo "4. 监控服务: kubectl get pods -n meteor-shower (K8s 模式)"
echo ""
echo "💡 更多信息请查看: DEPLOYMENT_GUIDE.md"
