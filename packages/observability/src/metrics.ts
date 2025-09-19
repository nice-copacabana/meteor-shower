import chalk from 'chalk';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  currentValue: number;
  status: 'ok' | 'warning' | 'critical';
  lastTriggered?: Date;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private alerts: Map<string, Alert> = new Map();
  private maxMetrics = 10000; // 限制内存使用

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Metric = {
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

  getMetrics(name?: string, tags?: Record<string, string>): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (tags) {
      filtered = filtered.filter(m => 
        Object.entries(tags).every(([key, value]) => m.tags[key] === value)
      );
    }

    return filtered;
  }

  getLatestMetric(name: string): Metric | null {
    const metrics = this.getMetrics(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  createAlert(name: string, condition: string, threshold: number): Alert {
    const alert: Alert = {
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

  private checkAlerts(metricName: string, value: number): void {
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
        } else if (!shouldTrigger && alert.status === 'critical') {
          alert.status = 'ok';
          console.log(chalk.green(`✅ 告警恢复: ${alert.name} = ${value}`));
        }
      }
    }
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts().filter(alert => alert.status !== 'ok');
  }

  // 预定义指标收集
  recordConfigApplied(tool: string, success: boolean): void {
    this.recordMetric('config_applied', success ? 1 : 0, { tool, success: success.toString() });
  }

  recordTemplateUsed(templateId: string): void {
    this.recordMetric('template_used', 1, { template_id: templateId });
  }

  recordUserAction(action: string, userId: string): void {
    this.recordMetric('user_action', 1, { action, user_id: userId });
  }

  recordSystemHealth(component: string, status: 'healthy' | 'degraded' | 'down'): void {
    const value = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
    this.recordMetric('system_health', value, { component, status });
  }
}
