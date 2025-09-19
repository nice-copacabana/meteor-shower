import chalk from 'chalk';
export class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.alerts = new Map();
        this.maxMetrics = 10000; // 限制内存使用
    }
    recordMetric(name, value, tags = {}) {
        const metric = {
            name,
            value,
            timestamp: new Date(),
            tags
        };
        this.metrics.push(metric);
        // 保持指标数量在限制内
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        // 检查告警
        this.checkAlerts(name, value);
    }
    getMetrics(name, tags) {
        let filtered = this.metrics;
        if (name) {
            filtered = filtered.filter(m => m.name === name);
        }
        if (tags) {
            filtered = filtered.filter(m => Object.entries(tags).every(([key, value]) => m.tags[key] === value));
        }
        return filtered;
    }
    getLatestMetric(name) {
        const metrics = this.getMetrics(name);
        return metrics.length > 0 ? metrics[metrics.length - 1] : null;
    }
    createAlert(name, condition, threshold) {
        const alert = {
            id: `alert-${Date.now()}`,
            name,
            condition,
            threshold,
            currentValue: 0,
            status: 'ok'
        };
        this.alerts.set(alert.id, alert);
        console.log(chalk.blue(`🚨 告警规则创建: ${name} (${condition} > ${threshold})`));
        return alert;
    }
    checkAlerts(metricName, value) {
        for (const alert of this.alerts.values()) {
            if (alert.name === metricName) {
                alert.currentValue = value;
                let shouldTrigger = false;
                switch (alert.condition) {
                    case 'gt':
                        shouldTrigger = value > alert.threshold;
                        break;
                    case 'lt':
                        shouldTrigger = value < alert.threshold;
                        break;
                    case 'eq':
                        shouldTrigger = value === alert.threshold;
                        break;
                }
                if (shouldTrigger && alert.status !== 'critical') {
                    alert.status = 'critical';
                    alert.lastTriggered = new Date();
                    console.log(chalk.red(`🚨 告警触发: ${alert.name} = ${value} (阈值: ${alert.threshold})`));
                }
                else if (!shouldTrigger && alert.status === 'critical') {
                    alert.status = 'ok';
                    console.log(chalk.green(`✅ 告警恢复: ${alert.name} = ${value}`));
                }
            }
        }
    }
    getAlerts() {
        return Array.from(this.alerts.values());
    }
    getActiveAlerts() {
        return this.getAlerts().filter(alert => alert.status !== 'ok');
    }
    // 预定义指标收集
    recordConfigApplied(tool, success) {
        this.recordMetric('config_applied', success ? 1 : 0, { tool, success: success.toString() });
    }
    recordTemplateUsed(templateId) {
        this.recordMetric('template_used', 1, { template_id: templateId });
    }
    recordUserAction(action, userId) {
        this.recordMetric('user_action', 1, { action, user_id: userId });
    }
    recordSystemHealth(component, status) {
        const value = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
        this.recordMetric('system_health', value, { component, status });
    }
}
