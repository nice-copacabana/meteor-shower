#!/bin/bash

# meteor-shower 生产环境部署脚本
# 用于配置域名、SSL证书和监控告警

set -e

echo "🚀 开始生产环境部署配置..."

# 配置变量
DOMAIN=${DOMAIN:-"meteor-shower.example.com"}
EMAIL=${EMAIL:-"admin@example.com"}
ENV=${ENV:-"production"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查 Nginx
    if ! command -v nginx &> /dev/null; then
        log_warning "Nginx 未安装，将使用 Docker 版本"
    fi
    
    # 检查 Certbot
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot 未安装，将跳过 SSL 证书配置"
    fi
    
    log_success "依赖检查完成"
}

# 生成 Nginx 配置
generate_nginx_config() {
    log_info "生成 Nginx 配置..."
    
    mkdir -p ./nginx/conf.d
    
    cat > ./nginx/conf.d/meteor-shower.conf << EOF
# meteor-shower Nginx 配置
upstream meteor_shower_backend {
    server app:3000;
}

upstream meteor_shower_ui {
    server app:3001;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    
    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 重定向到 HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 主应用路由
    location / {
        proxy_pass http://meteor_shower_ui;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API 路由
    location /api/ {
        proxy_pass http://meteor_shower_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # API 特定配置
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://meteor_shower_backend/health;
        access_log off;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://meteor_shower_ui;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    log_success "Nginx 配置生成完成"
}

# 生成 Docker Compose 生产配置
generate_docker_compose_prod() {
    log_info "生成生产环境 Docker Compose 配置..."
    
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  app:
    image: meteor-shower:latest
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - UI_PORT=3001
      - DOMAIN=${DOMAIN}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - meteor-shower
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - meteor-shower
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - meteor-shower

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    networks:
      - meteor-shower

  alertmanager:
    image: prom/alertmanager:latest
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    networks:
      - meteor-shower

networks:
  meteor-shower:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF

    log_success "Docker Compose 生产配置生成完成"
}

# 生成监控配置
generate_monitoring_config() {
    log_info "生成监控配置..."
    
    mkdir -p ./monitoring
    
    # Prometheus 配置
    cat > ./monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'meteor-shower'
    static_configs:
      - targets: ['app:3000']
    scrape_interval: 10s
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 10s
EOF

    # 告警规则
    cat > ./monitoring/alert_rules.yml << EOF
groups:
  - name: meteor-shower-alerts
    rules:
      - alert: HighResponseTime
        expr: meteor_shower_response_time_seconds > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "响应时间过高"
          description: "meteor-shower 响应时间超过 5 秒"

      - alert: HighErrorRate
        expr: rate(meteor_shower_errors_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "错误率过高"
          description: "meteor-shower 错误率超过 10%"

      - alert: ServiceDown
        expr: up{job="meteor-shower"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "meteor-shower 服务已停止"
EOF

    # Alertmanager 配置
    cat > ./monitoring/alertmanager.yml << EOF
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: '${EMAIL}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: '${EMAIL}'
        subject: 'meteor-shower 告警: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          告警名称: {{ .Annotations.summary }}
          告警详情: {{ .Annotations.description }}
          告警时间: {{ .StartsAt }}
          {{ end }}
    
    webhook_configs:
      - url: 'http://app:3001/api/webhooks/alerts'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

    log_success "监控配置生成完成"
}

# 配置 SSL 证书
configure_ssl() {
    log_info "配置 SSL 证书..."
    
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot 未安装，跳过 SSL 配置"
        return
    fi
    
    # 创建 certbot 目录
    mkdir -p ./certbot/conf
    mkdir -p ./certbot/www
    
    # 检查是否已有证书
    if [ -f "./certbot/conf/live/${DOMAIN}/fullchain.pem" ]; then
        log_info "证书已存在，跳过初始化"
        return
    fi
    
    # 启动临时 nginx 容器进行证书验证
    log_info "启动临时 Nginx 容器..."
    docker run -d --name temp-nginx \
        -p 80:80 \
        -v ./certbot/www:/var/www/certbot \
        nginx:alpine
    
    # 获取证书
    log_info "获取 SSL 证书..."
    docker run --rm \
        -v ./certbot/conf:/etc/letsencrypt \
        -v ./certbot/www:/var/www/certbot \
        certbot/certbot \
        certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN}
    
    # 停止临时容器
    docker stop temp-nginx
    docker rm temp-nginx
    
    log_success "SSL 证书配置完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用..."
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker build -t meteor-shower:latest .
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # 启动服务
    log_info "启动生产服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    if curl -f http://localhost/health &> /dev/null; then
        log_success "应用部署成功"
    else
        log_error "应用部署失败，请检查日志"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# 配置监控告警
configure_monitoring() {
    log_info "配置监控告警..."
    
    # 等待 Prometheus 启动
    log_info "等待 Prometheus 启动..."
    timeout 60 bash -c 'while ! curl -f http://localhost:9090/-/ready &> /dev/null; do sleep 5; done'
    
    # 等待 Grafana 启动
    log_info "等待 Grafana 启动..."
    timeout 60 bash -c 'while ! curl -f http://localhost:3000/api/health &> /dev/null; do sleep 5; done'
    
    # 导入 Grafana 仪表板
    log_info "导入 Grafana 仪表板..."
    # 这里可以添加仪表板导入逻辑
    
    log_success "监控告警配置完成"
}

# 设置定时任务
setup_cron_jobs() {
    log_info "设置定时任务..."
    
    # 备份任务
    echo "0 2 * * * cd $(pwd) && ./scripts/backup.sh" | crontab -
    
    # 日志轮转
    echo "0 0 * * * cd $(pwd) && docker-compose -f docker-compose.prod.yml exec app npm run log:rotate" | crontab -
    
    # 证书更新
    echo "0 12 * * * cd $(pwd) && docker-compose -f docker-compose.prod.yml exec certbot certbot renew --quiet" | crontab -
    
    log_success "定时任务设置完成"
}

# 生成部署报告
generate_deployment_report() {
    log_info "生成部署报告..."
    
    cat > deployment_report.md << EOF
# meteor-shower 生产环境部署报告

## 部署信息
- **部署时间**: $(date)
- **域名**: ${DOMAIN}
- **环境**: ${ENV}
- **部署者**: $(whoami)

## 服务状态
$(docker-compose -f docker-compose.prod.yml ps)

## 访问地址
- **主应用**: https://${DOMAIN}
- **监控仪表板**: https://${DOMAIN}:3000
- **Prometheus**: https://${DOMAIN}:9090
- **Alertmanager**: https://${DOMAIN}:9093

## 配置文件
- Nginx 配置: ./nginx/conf.d/meteor-shower.conf
- Docker Compose: ./docker-compose.prod.yml
- 监控配置: ./monitoring/

## 证书信息
$(if [ -f "./certbot/conf/live/${DOMAIN}/fullchain.pem" ]; then
    echo "SSL 证书: 已配置"
    openssl x509 -in ./certbot/conf/live/${DOMAIN}/fullchain.pem -text -noout | grep -A2 "Validity"
else
    echo "SSL 证书: 未配置"
fi)

## 监控状态
- Prometheus: $(curl -s http://localhost:9090/-/ready && echo "运行中" || echo "未运行")
- Grafana: $(curl -s http://localhost:3000/api/health && echo "运行中" || echo "未运行")
- Alertmanager: $(curl -s http://localhost:9093/-/ready && echo "运行中" || echo "未运行")

## 下一步操作
1. 配置域名 DNS 解析到服务器 IP
2. 验证 SSL 证书和 HTTPS 访问
3. 配置监控告警通知
4. 设置备份策略
5. 配置日志聚合

## 维护命令
\`\`\`bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新应用
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 备份数据
./scripts/backup.sh

# 证书续期
docker-compose -f docker-compose.prod.yml exec certbot certbot renew
\`\`\`
EOF

    log_success "部署报告生成完成: deployment_report.md"
}

# 主函数
main() {
    echo "======================================"
    echo "🚀 meteor-shower 生产环境部署"
    echo "======================================"
    echo ""
    
    log_info "域名: ${DOMAIN}"
    log_info "邮箱: ${EMAIL}"
    log_info "环境: ${ENV}"
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 生成配置文件
    generate_nginx_config
    generate_docker_compose_prod
    generate_monitoring_config
    
    # 配置 SSL
    configure_ssl
    
    # 部署应用
    deploy_application
    
    # 配置监控
    configure_monitoring
    
    # 设置定时任务
    setup_cron_jobs
    
    # 生成报告
    generate_deployment_report
    
    echo ""
    echo "======================================"
    log_success "🎉 生产环境部署完成！"
    echo "======================================"
    echo ""
    log_info "访问地址: https://${DOMAIN}"
    log_info "监控地址: https://${DOMAIN}:3000"
    log_info "部署报告: deployment_report.md"
    echo ""
    log_info "请完成以下后续配置："
    echo "1. 配置域名 DNS 解析"
    echo "2. 验证 SSL 证书"
    echo "3. 测试监控告警"
    echo "4. 配置备份策略"
    echo ""
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi