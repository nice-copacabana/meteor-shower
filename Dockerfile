FROM node:18-alpine AS base

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# 安装所有依赖
RUN npm install

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# 只安装生产依赖
RUN npm install --only=production

# 从构建阶段复制构建结果
COPY --from=base /app/packages/*/dist ./packages/*/dist
COPY --from=base /app/packages/*/package.json ./packages/*/package.json

# 复制其他必要文件
COPY scripts/ ./scripts/
COPY examples/ ./examples/

# 暴露端口
EXPOSE 3000 3001 3002

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动脚本
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
