# M7 能力验证案例库 - 详细实施计划

## 📋 规划概述

**创建时间**: 2025-10-15  
**负责人**: 开发团队  
**预计完成时间**: 5周  
**当前状态**: 规划中

## 🎯 模块目标

构建专家驱动的能力验证案例库，为用户提供标准化的AI模型能力评估工具，通过精巧测试案例验证大模型的真实能力边界。

### 核心价值

1. **专家驱动**: 由社区资深专家设计高质量测试案例
2. **标准化评估**: 建立统一的模型能力评估基准
3. **多维度对比**: 支持跨工具、跨模型的能力对比
4. **社区生态**: 构建活跃的专家社区和案例生态

## 📊 架构设计

### 三层架构

```
┌─────────────────────────────────────────┐
│         用户界面层 (UI Layer)            │
├─────────────────────────────────────────┤
│  Web案例库  │  CLI工具  │  移动端       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       业务逻辑层 (Business Layer)        │
├─────────────────────────────────────────┤
│  CaseManager    │  ExecutionEngine      │
│  ResultEvaluator│  CommunityService     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       数据存储层 (Data Layer)            │
├─────────────────────────────────────────┤
│  PostgreSQL     │  Redis缓存            │
│  时序数据库      │  文件存储             │
└─────────────────────────────────────────┘
```

## 🚀 Phase 1: 核心案例管理 (2周)

### 任务1: 案例数据模型 ✅ (已完成占位符)

**目标**: 实现完整的ValidationCase数据结构

**核心数据结构**:
```typescript
interface ValidationCase {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;       // 10个能力类别
  difficulty: DifficultyLevel;  // 5个难度等级
  tags: string[];
  scenario: {
    context: string;
    task: string;
    input: string;
    constraints: string[];
  };
  expected: {
    type: 'exact' | 'pattern' | 'criteria' | 'creative';
    content: string;
    criteria: string[];
  };
  scoring: {
    accuracy: number;
    completeness: number;
    creativity: number;
    efficiency: number;
  };
  author: {
    name: string;
    expertise: string;
    reputation: number;
  };
  stats: {
    submissions: number;
    averageScore: number;
    passRate: number;
  };
}
```

**能力类别枚举** (10个):
1. **代码生成** (CODE_GENERATION): 生成代码片段或完整功能
2. **逻辑推理** (LOGICAL_REASONING): 复杂逻辑问题求解
3. **创意写作** (CREATIVE_WRITING): 文学创作和内容生成
4. **问题解决** (PROBLEM_SOLVING): 综合问题解决能力
5. **数据分析** (DATA_ANALYSIS): 数据处理和洞察
6. **翻译润色** (TRANSLATION): 多语言翻译和文本优化
7. **知识问答** (KNOWLEDGE_QA): 专业知识问答
8. **对话理解** (CONVERSATION): 对话理解和上下文把握
9. **代码审查** (CODE_REVIEW): 代码质量评估
10. **文档生成** (DOCUMENTATION): 技术文档编写

**难度等级** (5个):
1. **入门级** (BEGINNER): 基础能力测试
2. **进阶级** (INTERMEDIATE): 中等难度挑战
3. **专家级** (ADVANCED): 高难度专业测试
4. **大师级** (EXPERT): 极具挑战性的案例
5. **传奇级** (LEGENDARY): 业界难题级别

**实施要点**:
- [x] 定义完整的TypeScript接口
- [ ] 实现数据验证Schema
- [ ] 创建数据库表结构
- [ ] 编写单元测试

### 任务2: CRUD操作实现

**目标**: 实现案例的完整生命周期管理

**核心功能**:
```typescript
class CaseManager {
  // 创建案例
  async createCase(caseData: Partial<ValidationCase>): Promise<ValidationCase>
  
  // 查询案例
  async getCase(caseId: string): Promise<ValidationCase | null>
  async listCases(filters: CaseFilters): Promise<ValidationCase[]>
  async searchCases(query: string): Promise<ValidationCase[]>
  
  // 更新案例
  async updateCase(caseId: string, updates: Partial<ValidationCase>): Promise<ValidationCase>
  
  // 删除案例
  async deleteCase(caseId: string): Promise<boolean>
  
  // 版本管理
  async getCaseVersions(caseId: string): Promise<CaseVersion[]>
  async revertToVersion(caseId: string, version: string): Promise<ValidationCase>
}
```

**查询过滤器**:
- 按类别筛选
- 按难度筛选
- 按标签筛选
- 按作者筛选
- 按评分范围筛选
- 按日期范围筛选

**实施要点**:
- [ ] 实现CaseManager核心类
- [ ] 实现数据库DAO层
- [ ] 添加缓存层(Redis)
- [ ] 实现搜索功能(全文搜索)
- [ ] 编写集成测试

### 任务3: 分类体系实现

**目标**: 实现10个能力类别和5个难度等级的完整体系

**分类管理功能**:
```typescript
class CategoryManager {
  // 获取所有类别
  getCategoriesInfo(): CategoryInfo[]
  
  // 获取类别统计
  getCategoryStats(category: CaseCategory): CategoryStats
  
  // 获取难度分布
  getDifficultyDistribution(category?: CaseCategory): DifficultyStats
  
  // 推荐类别
  recommendCategories(userId: string): CaseCategory[]
}
```

**统计信息**:
- 每个类别的案例数量
- 每个难度级别的案例分布
- 平均通过率
- 热门标签

**实施要点**:
- [ ] 实现CategoryManager类
- [ ] 设计分类展示UI
- [ ] 实现统计聚合查询
- [ ] 添加分类图标和描述

### 任务4: 基础CLI命令

**目标**: 实现案例管理的基础CLI命令

**命令列表**:
```bash
# 创建案例
meteor-shower case create [--interactive]

# 列出案例
meteor-shower case list [--category CODE_GENERATION] [--difficulty ADVANCED]

# 显示案例详情
meteor-shower case show <case-id>

# 搜索案例
meteor-shower case search <query>

# 编辑案例
meteor-shower case edit <case-id>

# 删除案例
meteor-shower case delete <case-id>

# 导入/导出案例
meteor-shower case import <file>
meteor-shower case export <case-id> [--output file.json]
```

**交互式创建流程**:
1. 选择能力类别
2. 选择难度等级
3. 输入基本信息
4. 定义场景描述
5. 设置期望结果
6. 配置评分标准
7. 预览并确认

**实施要点**:
- [ ] 实现CLI命令框架
- [ ] 添加交互式表单(inquirer)
- [ ] 实现案例验证逻辑
- [ ] 添加彩色输出和进度条
- [ ] 编写CLI测试

## 🚀 Phase 2: 执行引擎与评估 (1周)

### 任务1: 执行引擎实现

**目标**: 实现多AI工具的统一执行接口

**核心接口**:
```typescript
interface ExecutionEngine {
  // 执行单个案例
  executeCase(params: ExecutionParams): Promise<CaseExecution>
  
  // 批量执行
  batchExecute(params: BatchExecutionParams): Promise<CaseExecution[]>
  
  // 停止执行
  stopExecution(executionId: string): Promise<void>
}

interface ExecutionParams {
  caseId: string;
  tool: 'gemini' | 'claude' | 'cursor' | 'openai';
  config: ToolConfig;
  timeout?: number;
}

interface CaseExecution {
  id: string;
  caseId: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  output: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    tokensUsed: number;
    cost: number;
  };
  scores?: EvaluationScores;
}
```

**工具适配器**:
- 复用现有的adapters包
- 统一输入输出格式
- 错误处理和重试机制
- 超时控制

**实施要点**:
- [ ] 实现ExecutionEngine类
- [ ] 集成现有适配器
- [ ] 实现执行队列
- [ ] 添加并发控制
- [ ] 实现进度跟踪

### 任务2: 智能评分系统

**目标**: 实现多维度评估算法

**评分维度**:
```typescript
interface EvaluationScores {
  // 准确性 (0-100)
  accuracy: number;
  
  // 完整性 (0-100)
  completeness: number;
  
  // 创新性 (0-100)
  creativity: number;
  
  // 效率 (0-100)
  efficiency: number;
  
  // 总分 (加权平均)
  overall: number;
  
  // 自定义评分
  customScores: Record<string, number>;
}
```

**评估策略**:
1. **精确匹配**: 输出与期望完全一致
2. **模式匹配**: 使用正则表达式匹配
3. **标准匹配**: 满足预定义的多个标准
4. **创意评估**: 人工审核或AI辅助评估

**实施要点**:
- [ ] 实现ResultEvaluator类
- [ ] 实现多种评估策略
- [ ] 添加AI辅助评估(可选)
- [ ] 实现人工审核流程
- [ ] 编写评估测试用例

### 任务3: 对比分析功能

**目标**: 实现跨工具对比分析

**对比报告**:
```typescript
interface ComparisonReport {
  caseId: string;
  caseTitle: string;
  executions: CaseExecution[];
  ranking: {
    tool: string;
    score: number;
    rank: number;
  }[];
  insights: {
    bestTool: string;
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
  recommendations: string[];
}
```

**分析维度**:
- 总分排名
- 各维度得分对比
- 成本效益分析
- 响应时间对比
- 推荐使用场景

**实施要点**:
- [ ] 实现ComparisonAnalyzer类
- [ ] 生成对比报告
- [ ] 实现可视化图表
- [ ] 添加导出功能(PDF/HTML)

### 任务4: 结果存储

**目标**: 实现执行结果的持久化存储

**存储方案**:
- **主数据库**: 案例和用户数据
- **时序数据库**: 执行历史和性能数据
- **缓存层**: 热点数据和会话数据
- **对象存储**: 大文件和附件

**数据Schema**:
```sql
CREATE TABLE case_executions (
  id VARCHAR(36) PRIMARY KEY,
  case_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  tool VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  output TEXT,
  scores JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (case_id) REFERENCES validation_cases(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_executions_case ON case_executions(case_id);
CREATE INDEX idx_executions_user ON case_executions(user_id);
CREATE INDEX idx_executions_created ON case_executions(created_at);
```

**实施要点**:
- [ ] 设计数据库表结构
- [ ] 实现数据访问层
- [ ] 添加数据压缩(大输出)
- [ ] 实现数据清理策略
- [ ] 优化查询性能

## 📈 成功标准

### Phase 1 验收标准
- [ ] 案例CRUD操作功能完整
- [ ] 10个能力类别全部实现
- [ ] 5个难度等级正确分类
- [ ] CLI命令可用且交互友好
- [ ] 单元测试覆盖率>80%

### Phase 2 验收标准
- [ ] 执行引擎支持4种AI工具
- [ ] 评分系统准确可靠
- [ ] 对比分析报告清晰有用
- [ ] 数据存储性能满足需求
- [ ] 集成测试全部通过

## 🔄 集成依赖

### 依赖的现有模块
- **adapters**: AI工具适配器
- **user-tier**: 用户权限和配额
- **database**: 数据库管理
- **cli**: CLI框架

### 被依赖的未来模块
- **task-coordination**: M8任务协调管理

## 📅 时间线

```
Week 1-2: Phase 1 核心案例管理
  ├─ Day 1-3: 数据模型和数据库设计
  ├─ Day 4-7: CRUD操作实现
  └─ Day 8-10: 分类体系和CLI命令

Week 3: Phase 2 执行引擎与评估
  ├─ Day 1-2: 执行引擎实现
  ├─ Day 3-4: 智能评分系统
  ├─ Day 5: 对比分析功能
  └─ Day 6-7: 结果存储和测试

Week 4-5: 预留给Phase 3-4 (社区和UI)
```

## 🎯 下一步行动

1. ✅ 完成规划文档
2. ⏳ 开始Phase 1任务1: 扩展案例数据模型
3. ⏳ 创建数据库迁移脚本
4. ⏳ 实现CaseManager核心类

---

**文档维护者**: meteor-shower 开发团队  
**最后更新**: 2025-10-15  
**版本**: v1.0
