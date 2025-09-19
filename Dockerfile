FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# 安装所有依赖（包括 devDependencies，因为需要构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 删除 devDependencies 以减小镜像大小
RUN npm prune --production

# 暴露端口
EXPOSE 3000 3001 3002

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动脚本
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
