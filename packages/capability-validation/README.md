# @meteor-shower/capability-validation

> 能力验证案例库 - 专家贡献的精巧测试案例

## 📋 概述

本模块为 meteor-shower 平台提供专家驱动的能力验证案例库，让社区专家贡献高质量的测试案例，为用户提供标准化的AI模型能力评估工具。

## 🎯 核心价值

### 解决的问题
- **配置效果难验证**：应用了新的配置或提示词，但缺乏合适的测试场景验证效果
- **模型能力难评估**：不同AI工具和模型的能力边界不清晰，选择困难
- **专家知识难传承**：资深专家的测试经验和巧妙案例缺乏分享渠道
- **评估标准不统一**：缺乏客观、标准化的模型能力评估基准

### 核心理念
**不是AI生成测试用例，而是人类专家精心设计的验证案例**

这些案例具有以下特点：
- **简单而精妙**：用最简洁的方式暴露模型能力边界
- **专家贡献**：由社区大牛和领域专家设计
- **标准化**：统一的评估标准，可客观对比
- **实用性**：能有效验证提示词和配置的真实价值

## 🚀 核心功能

### 1. 专家案例库
- **分类管理**：代码生成、逻辑推理、创意写作、问题解决等10+类别
- **难度分级**：从入门级到传奇级的5个难度等级
- **专家认证**：社区专家贡献和认证机制
- **版本管理**：案例的持续迭代和改进

### 2. 多工具执行对比
- **跨工具测试**：同一案例在Gemini、Claude、Cursor、OpenAI上执行
- **配置对比**：不同提示词和规则配置的效果对比
- **历史追踪**：模型能力的改进轨迹
- **智能评分**：基于多维度标准的自动评估

### 3. 社区专家系统  
- **专家认证**：基于贡献和专业能力的认证体系
- **声誉系统**：专家声誉和等级管理
- **质量控制**：社区评分和专家审核机制
- **知识传承**：专家经验的结构化分享

### 4. 能力分析报告
- **对比分析**：工具和配置的全方位对比
- **趋势分析**：模型能力发展趋势
- **推荐建议**：基于测试结果的使用建议
- **可视化展示**：雷达图、柱状图、热力图等

## 📦 安装

```bash
npm install @meteor-shower/capability-validation
```

## 🚀 使用

### CLI 使用

```bash
# 案例管理
meteor-shower case create --title "逻辑陷阱识别" --category logical_reasoning
meteor-shower case list --category code_generation --difficulty expert
meteor-shower case show <case-id>

# 案例执行
meteor-shower case run <case-id> --tool gemini --config my-config
meteor-shower case compare <case-id> --tools gemini,claude,cursor
meteor-shower case batch-run case-1 case-2 --tools all

# 社区功能
meteor-shower case share <case-id>
meteor-shower case rate <case-id> --rating 5 --comment "excellent"
meteor-shower case featured --limit 10

# 结果查看
meteor-shower case results <execution-id>
meteor-shower case report <case-id> --format pdf
```

### API 使用

```typescript
import { 
  CaseManager, 
  CaseExecutor, 
  CaseCategory, 
  DifficultyLevel 
} from '@meteor-shower/capability-validation';

// 创建案例管理器
const caseManager = new CaseManager();

// 创建测试案例
const testCase = await caseManager.createCase({
  title: '自指悖论识别',
  category: CaseCategory.LOGICAL_REASONING,
  difficulty: DifficultyLevel.ADVANCED,
  scenario: {
    context: '经典的逻辑悖论测试',
    task: '识别并解释下述语句的逻辑问题',
    input: '这句话是假的。'
  },
  expected: {
    type: 'criteria',
    criteria: [
      '识别自指悖论的性质',
      '解释循环逻辑的问题', 
      '提出可能的解决思路'
    ]
  },
  author: {
    name: 'LogicExpert',
    expertise: '逻辑学博士'
  }
});

// 执行案例
const executor = new CaseExecutor();
const result = await executor.executeCase(testCase.id, 'claude');

console.log(`执行结果评分: ${result.scores.overall}/100`);
console.log(`优势: ${result.analysis?.strengths.join(', ')}`);
console.log(`建议: ${result.analysis?.suggestions.join(', ')}`);

// 获取专家推荐案例
const featuredCases = await caseManager.getCases({
  difficulty: DifficultyLevel.EXPERT,
  category: CaseCategory.CODE_GENERATION
});

// 对比执行
const comparison = await executor.batchExecute(
  [testCase.id],
  ['gemini', 'claude', 'cursor']
);
```

## 🎨 案例示例

### 示例1：逻辑推理挑战
```json
{
  "title": "自指悖论识别", 
  "category": "logical_reasoning",
  "difficulty": "advanced",
  "scenario": {
    "context": "经典的逻辑悖论测试",
    "task": "识别并解释下述语句的逻辑问题",
    "input": "这句话是假的。"
  },
  "expected": {
    "type": "criteria",
    "criteria": [
      "识别自指悖论的性质",
      "解释循环逻辑的问题",
      "提出可能的解决思路"
    ]
  }
}
```

### 示例2：代码边界测试
```json
{
  "title": "安全数组访问",
  "category": "code_generation", 
  "difficulty": "expert",
  "scenario": {
    "context": "编写一个处理所有边界情况的安全函数",
    "task": "实现 safeArrayAccess(arr, index) 函数",
    "input": "考虑空数组、负索引、越界、非数组输入等情况"
  },
  "expected": {
    "type": "criteria",
    "criteria": [
      "处理空数组情况",
      "处理负索引", 
      "处理越界索引",
      "处理非数组输入",
      "提供清晰的错误处理"
    ]
  }
}
```

### 示例3：创意写作挑战
```json
{
  "title": "反向视角叙述",
  "category": "creative_writing",
  "difficulty": "legendary", 
  "scenario": {
    "context": "创意写作的视角转换挑战",
    "task": "从大灰狼的角度重新讲述《小红帽》",
    "input": "要求：合理的动机、完整的情节、创新的诠释"
  },
  "expected": {
    "type": "creative",
    "criteria": [
      "视角转换的合理性",
      "情节的创新性",
      "人物性格的重新塑造", 
      "故事的完整性和逻辑性"
    ]
  }
}
```

## 🏗️ 架构设计

### 核心组件
- **CaseManager**: 案例的创建、管理、搜索
- **CaseExecutor**: 多工具执行引擎  
- **ResultEvaluator**: 智能评估和对比
- **CommunityService**: 社区功能和专家系统

### 数据模型
```typescript
interface ValidationCase {
  id: string;
  title: string;
  category: CaseCategory;
  difficulty: DifficultyLevel;
  scenario: {
    context: string;
    task: string; 
    input: string;
    constraints?: string[];
  };
  expected: {
    type: 'exact' | 'pattern' | 'criteria' | 'creative';
    content?: string;
    criteria?: string[];
  };
  author: {
    name: string;
    expertise?: string;
  };
}
```

## 🔧 配置

在项目根目录创建 `capability-validation.config.json`：

```json
{
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "capability_validation"
  },
  "execution": {
    "timeout": 120000,
    "maxConcurrency": 5,
    "retryAttempts": 3
  },
  "evaluation": {
    "defaultWeights": {
      "accuracy": 40,
      "completeness": 30, 
      "creativity": 20,
      "efficiency": 10
    }
  },
  "community": {
    "expertThreshold": 100,
    "certificationRequired": true
  }
}
```

## 📊 预期效果

### 核心指标
- **案例质量**：专家贡献，平均评分4.5+/5.0
- **覆盖全面**：10+能力类别，5个难度等级
- **使用活跃**：月执行量10000+次
- **专家参与**：100+认证专家贡献
- **标准建立**：行业认可的评估基准

### 用户价值
- **客观评估**：基于标准化案例的模型能力评估
- **配置优化**：验证提示词和规则的实际效果
- **学习提升**：学习专家设计的精妙测试思路
- **决策支持**：数据驱动的工具和配置选择

### 社区价值
- **知识传承**：专家经验的结构化分享
- **标准统一**：建立行业评估标准
- **生态繁荣**：促进AI工具的良性竞争
- **持续改进**：社区驱动的案例质量提升

## 📝 开发状态

**当前状态**：规划中（M6 阶段）

详细设计文档请参考：[CAPABILITY_VALIDATION_MODULE_DESIGN.md](../../CAPABILITY_VALIDATION_MODULE_DESIGN.md)

## 🗺️ 实施路线图

- [ ] **Phase 1**: 核心案例管理（2周）- 案例CRUD、分类管理、基础UI
- [ ] **Phase 2**: 执行引擎和评估（1周）- 多工具执行、智能评分、对比分析  
- [ ] **Phase 3**: 社区功能（1周）- 专家系统、评价机制、推荐算法
- [ ] **Phase 4**: UI完善和高级功能（1周）- 完整界面、数据可视化、移动端

## 💡 贡献指南

### 如何贡献优质案例
1. **明确目标**：案例应该测试特定的AI能力
2. **简洁有效**：用最少的输入暴露最多的能力信息
3. **标准清晰**：提供明确的评判标准
4. **创新性**：避免重复，提供独特的测试角度
5. **实用性**：案例应该对实际使用有指导意义

### 专家认证申请
- 提供专业背景和经验证明
- 贡献至少5个高质量案例
- 通过社区专家评审
- 维持良好的社区声誉

## 📄 许可证

MIT License