import chalk from 'chalk';
import { MetricsCollector, Alert, Metric } from './metrics.js';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // 冷却时间（毫秒）
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'console';
  config: Record<string, any>;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  message: string;
  timestamp: Date;
  metricValue: number;
  threshold: number;
  resolved: boolean;
}

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private events: AlertEvent[] = [];
  private lastTriggered: Map<string, Date> = new Map();
  private maxEvents = 1000;

  constructor(private metricsCollector: MetricsCollector) {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // 系统健康告警
    this.createRule({
      id: 'system-health-critical',
      name: '系统健康状态严重',
      description: '系统组件健康状态低于临界值',
      metricName: 'system_health',
      condition: 'lt',
      threshold: 0.5,
      severity: 'critical',
      enabled: true,
      cooldown: 300000, // 5分钟
      actions: [
        { type: 'console', config: {} },
        { type: 'webhook', config: { url: 'http://localhost:3001/api/alerts' } }
      ]
    });

    // 配置应用失败告警
    this.createRule({
      id: 'config-apply-failure',
      name: '配置应用失败率高',
      description: '配置应用失败率超过阈值',
      metricName: 'config_applied',
      condition: 'lt',
      threshold: 0.8,
      severity: 'high',
      enabled: true,
      cooldown: 600000, // 10分钟
      actions: [
        { type: 'console', config: {} }
      ]
    });

    // 性能告警
    this.createRule({
      id: 'response-time-high',
      name: '响应时间过高',
      description: '系统响应时间超过正常范围',
      metricName: 'response_time',
      condition: 'gt',
      threshold: 5000,
      severity: 'medium',
      enabled: true,
      cooldown: 300000, // 5分钟
      actions: [
        { type: 'console', config: {} }
      ]
    });

    console.log(chalk.blue(`🚨 初始化告警规则: ${this.rules.size} 个规则`));
  }

  createRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    console.log(chalk.green(`✅ 告警规则创建: ${rule.name}`));
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    console.log(chalk.yellow(`🔄 告警规则更新: ${rule.name}`));
    return true;
  }

  deleteRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.delete(ruleId);
    console.log(chalk.red(`🗑️  告警规则删除: ${rule.name}`));
    return true;
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = true;
    console.log(chalk.green(`✅ 告警规则启用: ${rule.name}`));
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = false;
    console.log(chalk.yellow(`⏸️  告警规则禁用: ${rule.name}`));
    return true;
  }

  checkMetric(metric: Metric): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.metricName !== metric.name) {
        continue;
      }

      // 检查冷却时间
      const lastTrigger = this.lastTriggered.get(rule.id);
      if (lastTrigger && Date.now() - lastTrigger.getTime() < rule.cooldown) {
        continue;
      }

      // 评估告警条件
      if (this.evaluateCondition(metric.value, rule.condition, rule.threshold)) {
        this.triggerAlert(rule, metric);
      }
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private triggerAlert(rule: AlertRule, metric: Metric): void {
    const event: AlertEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `${rule.description}: 当前值 ${metric.value}, 阈值 ${rule.threshold}`,
      timestamp: new Date(),
      metricValue: metric.value,
      threshold: rule.threshold,
      resolved: false
    };

    this.events.push(event);
    this.lastTriggered.set(rule.id, new Date());

    // 保持事件数量在限制内
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 执行告警动作
    this.executeActions(rule, event);

    console.log(chalk.red(`🚨 告警触发: ${rule.name} (${rule.severity})`));
  }

  private async executeActions(rule: AlertRule, event: AlertEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, event);
      } catch (error) {
        console.error(chalk.red(`❌ 告警动作执行失败: ${action.type}`), error);
      }
    }
  }

  private async executeAction(action: AlertAction, event: AlertEvent): Promise<void> {
    switch (action.type) {
      case 'console':
        console.log(chalk.bgRed.white(` ALERT `), event.message);
        break;

      case 'webhook':
        if (action.config.url) {
          // 模拟 webhook 调用
          console.log(chalk.blue(`📡 发送 webhook: ${action.config.url}`));
          // 在实际实现中，这里会发送 HTTP 请求
        }
        break;

      case 'email':
        if (action.config.to) {
          console.log(chalk.green(`📧 发送邮件至: ${action.config.to}`));
          // 在实际实现中，这里会发送邮件
        }
        break;

      case 'slack':
        if (action.config.webhook_url) {
          console.log(chalk.cyan(`💬 发送 Slack 消息`));
          // 在实际实现中，这里会发送 Slack 消息
        }
        break;

      default:
        console.warn(chalk.yellow(`⚠️  未知的告警动作类型: ${action.type}`));
    }
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(): AlertRule[] {
    return this.getRules().filter(rule => rule.enabled);
  }

  getEvents(limit = 100): AlertEvent[] {
    return this.events.slice(-limit);
  }

  getActiveEvents(): AlertEvent[] {
    return this.events.filter(event => !event.resolved);
  }

  resolveEvent(eventId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;

    event.resolved = true;
    console.log(chalk.green(`✅ 告警事件已解决: ${event.ruleName}`));
    return true;
  }

  getAlertSummary(): {
    totalRules: number;
    enabledRules: number;
    activeEvents: number;
    eventsBySeverity: Record<string, number>;
  } {
    const activeEvents = this.getActiveEvents();
    const eventsBySeverity = activeEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.rules.size,
      enabledRules: this.getEnabledRules().length,
      activeEvents: activeEvents.length,
      eventsBySeverity
    };
  }

  // 启动指标监控循环
  startMonitoring(intervalMs = 30000): void {
    setInterval(() => {
      // 检查最新的指标
      const recentMetrics = this.metricsCollector.getMetrics();
      const now = Date.now();
      
      // 只检查最近的指标
      const recentThreshold = now - intervalMs;
      recentMetrics
        .filter(metric => metric.timestamp.getTime() > recentThreshold)
        .forEach(metric => this.checkMetric(metric));
    }, intervalMs);

    console.log(chalk.blue(`🔍 告警监控已启动 (间隔: ${intervalMs}ms)`));
  }
}
