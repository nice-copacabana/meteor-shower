# meteor-shower 测试与部署指南

## 🧪 测试指南

### 1. 环境准备

```bash
# 确保 Node.js 18+ 已安装
node --version

# 安装依赖
npm install

# 构建项目
npm run build
```

### 2. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定包测试
npm test --workspace=packages/cli

# 运行 E2E 测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage
```

### 3. 手动测试 CLI

```bash
# 测试帮助信息
node packages/cli/dist/index.js --help

# 测试版本信息
node packages/cli/dist/index.js --version

# 测试 diff 命令
node packages/cli/dist/index.js diff

# 测试 mcp test 命令
node packages/cli/dist/index.js mcp test
```

### 4. 测试完整工作流

```bash
# 运行演示脚本
./scripts/demo.sh

# 启动全栈服务进行测试
./scripts/start-all.sh
```

## 🚀 部署指南

### 方式一：Docker 部署（推荐）

#### 1. 构建 Docker 镜像

```bash
# 构建镜像
docker build -t meteor-shower:latest .

# 查看镜像
docker images | grep meteor-shower
```

#### 2. 运行容器

```bash
# 单容器运行
docker run -d \
  --name meteor-shower \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 3002:3002 \
  meteor-shower:latest

# 查看运行状态
docker ps | grep meteor-shower
```

#### 3. 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：Kubernetes 部署

#### 1. 准备 Kubernetes 集群

```bash
# 确保 kubectl 已配置
kubectl cluster-info

# 创建命名空间
kubectl create namespace meteor-shower
```

#### 2. 部署应用

```bash
# 部署到 Kubernetes
kubectl apply -f k8s/deployment.yaml

# 查看部署状态
kubectl get pods -n meteor-shower

# 查看服务
kubectl get services -n meteor-shower
```

#### 3. 访问应用

```bash
# 获取服务 IP
kubectl get service meteor-shower-service -n meteor-shower

# 端口转发（本地访问）
kubectl port-forward service/meteor-shower-service 3000:3000 -n meteor-shower
kubectl port-forward service/meteor-shower-service 3001:3001 -n meteor-shower
kubectl port-forward service/meteor-shower-service 3002:3002 -n meteor-shower
```

### 方式三：本地开发部署

#### 1. 开发模式运行

```bash
# 启动 Cloud Hub
cd packages/cloud-hub
npm run dev &

# 启动 UI 控制台
cd ../ui
npm run dev &

# 启动 RAG 服务器
cd ../../examples/rag-server
npm run dev &
```

#### 2. 生产模式运行

```bash
# 构建所有包
npm run build

# 启动 Cloud Hub
cd packages/cloud-hub
npm start &

# 启动 UI 控制台
cd ../ui
npm start &

# 启动 RAG 服务器
cd ../../examples/rag-server
npm start &
```

## 🔍 验证部署

### 1. 健康检查

```bash
# Cloud Hub 健康检查
curl http://localhost:3000/health

# UI 控制台健康检查
curl http://localhost:3001/api/status

# RAG 服务器健康检查
curl http://localhost:3002/health
```

### 2. 功能验证

```bash
# 测试模板 API
curl http://localhost:3000/api/v1/templates

# 测试配置生成
curl -X POST http://localhost:3001/api/generate-config \
  -H "Content-Type: application/json" \
  -d '{"tools":["gemini"],"template":"basic","projectName":"test","persona":"test"}'

# 测试 MCP 状态
curl http://localhost:3001/api/mcp-status
```

### 3. 访问 Web 界面

- **UI 控制台**: http://localhost:3001
- **监控仪表板**: http://localhost:3001/monitoring-dashboard
- **Cloud Hub API**: http://localhost:3000

## 📊 监控和维护

### 1. 查看日志

```bash
# Docker 日志
docker logs meteor-shower

# Kubernetes 日志
kubectl logs -f deployment/meteor-shower -n meteor-shower

# 本地日志
tail -f logs/*.log
```

### 2. 性能监控

```bash
# 查看资源使用
docker stats meteor-shower

# Kubernetes 资源监控
kubectl top pods -n meteor-shower
```

### 3. 备份和恢复

```bash
# 备份配置
docker cp meteor-shower:/app/data ./backup/

# 恢复配置
docker cp ./backup/ meteor-shower:/app/data
```

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   ```

2. **依赖问题**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **权限问题**
   ```bash
   # 修复脚本权限
   chmod +x scripts/*.sh
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=* npm run dev

# Docker 调试模式
docker run -it --rm meteor-shower:latest /bin/bash
```

## �� 更新和维护

### 1. 自动更新

```bash
# 检查更新
node packages/updater/dist/index.js check

# 执行更新
node packages/updater/dist/index.js update
```

### 2. 手动更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建
npm run build

# 重启服务
docker-compose restart
```

## 📈 性能优化

### 1. 生产环境配置

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3000
export UI_PORT=3001
```

### 2. 资源限制

```yaml
# docker-compose.yml 中添加
services:
  meteor-shower:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 🎯 下一步

1. **配置域名和 SSL**
2. **设置监控告警**
3. **配置自动备份**
4. **设置日志聚合**
5. **配置负载均衡**

---

更多详细信息请参考项目文档和 README.md
