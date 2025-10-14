# @meteor-shower/task-coordination

> 任务协调管理模块

## 📋 概述

本模块为 meteor-shower 平台提供跨工具的AI任务协调管理功能，解决异步协作中的核心痛点。

## 🎯 解决的问题

### 现实场景
- **编写阶段**：人类花费1-几分钟编写需求、提示词
- **执行阶段**：AI工具需要几分钟到几十分钟执行任务
- **检查阶段**：人类需要检查结果，决定下一步行动

### 核心痛点
1. **多任务并行困难**：启动A、B、C、D多个任务，难以跟踪哪个先完成
2. **状态跟踪分散**：不同工具的完成提醒机制不统一，难以汇总
3. **上下文切换成本高**：频繁在多个工具和任务间切换
4. **工作碎片化**：缺乏统一的任务优先级和执行顺序管理

## 🚀 核心功能

### 1. 任务生命周期管理
- 任务创建、提交、执行、完成的全流程跟踪
- 支持9种任务状态：草稿→已提交→执行中→已完成→检查中→已通过/已拒绝等
- 任务依赖关系管理

### 2. 跨工具任务监控  
- 统一监控 Gemini、Claude、Cursor、OpenAI 等工具的任务状态
- 自动轮询和状态同步
- 实时进度更新

### 3. 智能调度与提醒
- 基于优先级、依赖关系、等待时间的智能调度算法
- 任务完成聚合通知
- 下一步行动建议

### 4. 工作流管理
- 预定义工作流模板（如代码审查流程）
- 支持条件分支、并行执行、脚本步骤
- 工作流执行监控

### 5. 统一任务仪表板
- 实时任务状态展示
- 性能分析和统计
- 工作效率报告

## 📦 安装

```bash
npm install @meteor-shower/task-coordination
```

## 🚀 使用

### CLI 使用

```bash
# 任务管理
meteor-shower task create --title "优化登录功能" --tool gemini --priority high
meteor-shower task list --status running
meteor-shower task show <task-id>
meteor-shower task review <task-id> --rating 5 --feedback "excellent"

# 调度管理  
meteor-shower schedule status
meteor-shower schedule suggestions
meteor-shower schedule start <task-id>

# 工作流管理
meteor-shower workflow start code-review-workflow --var code="./src/login.js"
meteor-shower workflow status <execution-id>

# 仪表板
meteor-shower dashboard
meteor-shower dashboard --refresh 30
```

### API 使用

```typescript
import { TaskCoordinator, TaskStatus } from '@meteor-shower/task-coordination';

// 创建任务协调器
const coordinator = new TaskCoordinator();

// 提交任务
const taskId = await coordinator.submitTask({
  title: '优化登录功能',
  tool: 'gemini',
  prompt: '请优化用户登录功能的性能和安全性',
  priority: 'high'
});

// 获取调度建议
const suggestions = await coordinator.getScheduleSuggestions();
console.log(suggestions); 
// [{ type: 'start_task', reason: '根据优先级建议启动此任务', urgency: 'high' }]

// 检查任务状态
const status = await coordinator.getTaskStatus(taskId);
if (status === TaskStatus.COMPLETED) {
  console.log('任务已完成，请检查结果');
}

// 获取所有任务
const allTasks = await coordinator.getAllTasks();
const runningTasks = allTasks.filter(t => t.status === TaskStatus.RUNNING);
console.log(`当前有 ${runningTasks.length} 个任务正在执行`);
```

## 🎨 核心概念

### 任务状态流转
```
DRAFT → SUBMITTED → RUNNING → COMPLETED → REVIEWING → APPROVED
                                      ↘ REVIEWING → REJECTED → SUBMITTED
                           ↘ FAILED → SUBMITTED
                           ↘ CANCELLED
```

### 调度策略
- **优先级权重**：urgent(100) > high(75) > medium(50) > low(25)  
- **依赖关系**：被依赖任务优先级+10分
- **等待时间**：等待越久优先级越高
- **快速任务奖励**：短时任务获得额外分数

### 通知类型
- 任务完成通知
- 任务失败通知  
- 检查提醒
- 调度建议
- 截止时间警告

## 🏗️ 架构设计

```
用户界面层: CLI命令 + Web界面 + 桌面通知
业务逻辑层: TaskCoordinator + Scheduler + Monitor + NotificationService  
适配器层: Gemini + Claude + Cursor + OpenAI适配器
数据存储层: SQLite/PostgreSQL + 本地缓存
```

### 核心类

- **TaskCoordinator**: 核心调度器，统一任务管理入口
- **TaskManager**: 任务CRUD操作和数据管理
- **TaskScheduler**: 智能调度算法和优先级计算
- **TaskMonitor**: 跨工具任务状态监控
- **NotificationService**: 多渠道通知服务
- **WorkflowEngine**: 工作流定义和执行引擎

## 🔧 配置

在项目根目录创建 `task-coordination.config.json`：

```json
{
  "database": {
    "type": "sqlite",
    "path": "./tasks.db"
  },
  "scheduling": {
    "strategy": "balanced",
    "maxConcurrency": 5,
    "pollInterval": 30
  },
  "notifications": {
    "desktop": true,
    "sound": true,
    "inApp": true
  },
  "tools": {
    "gemini": { "enabled": true, "timeout": 1800 },
    "claude": { "enabled": true, "timeout": 1200 },
    "cursor": { "enabled": true, "timeout": 900 },
    "openai": { "enabled": true, "timeout": 1500 }
  }
}
```

## 📊 预期效果

### 效率提升
- **任务管理时间**：减少30-50%
- **遗漏减少**：避免任务遗忘和重复执行  
- **上下文切换**：减少70%的工具间切换
- **并行效率**：提升40%的多任务处理能力

### 用户体验
- 统一的跨工具协作界面
- 智能的任务调度建议
- 及时的进度通知和提醒
- 清晰的工作优先级指导

## 📝 开发状态

**当前状态**：规划中（M7 阶段）

详细设计文档请参考：[TASK_COORDINATION_MODULE_DESIGN.md](../../TASK_COORDINATION_MODULE_DESIGN.md)

## 🗺️ 实施路线图

- [ ] **Phase 1**: 核心任务管理（2周）- 基础CRUD、状态管理、简单调度
- [ ] **Phase 2**: 智能调度与监控（2周）- 调度算法、跨工具监控、通知系统  
- [ ] **Phase 3**: 工作流与高级功能（1周）- 工作流引擎、批量处理
- [ ] **Phase 4**: 仪表板与优化（1周）- 统一仪表板、性能分析、数据可视化

## 🤝 贡献

欢迎贡献想法和反馈！这个模块将显著提升AI编程协作的效率。

## 📄 许可证

MIT License