/**
 * @meteor-shower/capability-validation
 * 
 * 能力验证案例库
 * 
 * 本模块提供专家贡献的精巧测试案例，用于：
 * - 验证大模型的真实能力边界
 * - 评估提示词和规则配置的实际价值
 * - 建立标准化的模型能力评估基准
 * - 促进专家知识的社区分享
 * 
 * 状态：规划中（M6 阶段）
 * 详细设计：参见 ../../CAPABILITY_VALIDATION_MODULE_DESIGN.md
 */

/**
 * 测试案例类别枚举
 */
export enum CaseCategory {
  CODE_GENERATION = 'code_generation',       // 代码生成
  LOGICAL_REASONING = 'logical_reasoning',   // 逻辑推理
  CREATIVE_WRITING = 'creative_writing',     // 创意写作
  PROBLEM_SOLVING = 'problem_solving',       // 问题解决
  TEXT_ANALYSIS = 'text_analysis',           // 文本分析
  MATH_CALCULATION = 'math_calculation',     // 数学计算
  LANGUAGE_UNDERSTANDING = 'language_understanding', // 语言理解
  DOMAIN_EXPERTISE = 'domain_expertise',     // 领域专业知识
  EDGE_CASES = 'edge_cases',                 // 边界情况
  CUSTOM = 'custom'                          // 自定义类别
}

/**
 * 案例难度等级
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',     // 入门级
  INTERMEDIATE = 'intermediate', // 进阶级
  ADVANCED = 'advanced',     // 专家级
  EXPERT = 'expert',         // 大师级
  LEGENDARY = 'legendary'    // 传奇级（极限挑战）
}

/**
 * 验证案例接口定义
 */
export interface ValidationCase {
  id: string;
  title: string;
  description: string;
  
  // 分类信息
  category: CaseCategory;
  difficulty: DifficultyLevel;
  tags: string[];
  
  // 案例内容
  scenario: {
    context: string;          // 背景描述
    task: string;            // 具体任务
    input: string;           // 输入内容
    constraints?: string[];   // 约束条件
  };
  
  // 期望结果
  expected: {
    type: 'exact' | 'pattern' | 'criteria' | 'creative';
    content?: string;        // 精确匹配内容
    pattern?: string;        // 正则表达式模式
    criteria?: string[];     // 评判标准列表
    examples?: string[];     // 示例答案
  };
  
  // 评分标准
  scoring: {
    accuracy: number;        // 准确性权重 (0-100)
    completeness: number;    // 完整性权重 (0-100)
    creativity: number;      // 创新性权重 (0-100)
    efficiency: number;      // 效率权重 (0-100)
    customCriteria?: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
  };
  
  // 作者信息
  author: {
    name: string;
    expertise?: string;      // 专业领域
    reputation?: number;     // 声誉分数
  };
  
  // 统计信息
  stats: {
    submissions: number;     // 提交次数
    averageScore: number;    // 平均得分
    passRate: number;        // 通过率
    toolPerformance: Record<string, {
      averageScore: number;
      attempts: number;
    }>;
  };
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  version: string;
  isPublic: boolean;
  isCertified?: boolean;   // 是否通过专家认证
}

/**
 * 案例执行结果
 */
export interface CaseExecution {
  id: string;
  caseId: string;
  tool: string;
  model?: string;
  config?: Record<string, any>;
  
  // 执行信息
  executedAt: Date;
  duration: number;        // 执行耗时（毫秒）
  
  // 结果数据
  output: string;
  
  // 评分结果
  scores: {
    accuracy: number;
    completeness: number;
    creativity: number;
    efficiency: number;
    overall: number;
    customScores?: Record<string, number>;
  };
  
  // 分析数据
  analysis?: {
    strengths: string[];     // 优势
    weaknesses: string[];    // 不足
    suggestions: string[];   // 改进建议
  };
  
  // 用户反馈
  userRating?: number;     // 用户评分 (1-5)
  userFeedback?: string;   // 用户反馈
}

/**
 * 案例管理器（占位）
 */
export class CaseManager {
  constructor() {
    console.log('CaseManager 初始化 - 功能开发中');
  }

  async createCase(caseData: Partial<ValidationCase>): Promise<ValidationCase> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async getCases(filter?: {
    category?: CaseCategory;
    difficulty?: DifficultyLevel;
    tags?: string[];
    author?: string;
  }): Promise<ValidationCase[]> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async getCaseById(caseId: string): Promise<ValidationCase | null> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async updateCase(caseId: string, updates: Partial<ValidationCase>): Promise<ValidationCase> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async deleteCase(caseId: string): Promise<void> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }
}

/**
 * 案例执行器（占位）
 */
export class CaseExecutor {
  constructor() {
    console.log('CaseExecutor 初始化 - 功能开发中');
  }

  async executeCase(
    caseId: string, 
    tool: string, 
    config?: Record<string, any>
  ): Promise<CaseExecution> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async batchExecute(
    caseIds: string[], 
    tools: string[]
  ): Promise<CaseExecution[]> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }
}

/**
 * 结果评估器（占位）
 */
export class ResultEvaluator {
  constructor() {
    console.log('ResultEvaluator 初始化 - 功能开发中');
  }

  async evaluateResult(
    validationCase: ValidationCase, 
    output: string
  ): Promise<CaseExecution['scores']> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async compareResults(executions: CaseExecution[]): Promise<{
    rankings: Array<{
      tool: string;
      model?: string;
      averageScore: number;
      strengths: string[];
    }>;
    insights: string[];
  }> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }
}

/**
 * 社区服务（占位）
 */
export class CommunityService {
  constructor() {
    console.log('CommunityService 初始化 - 功能开发中');
  }

  async shareCase(caseId: string): Promise<string> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async rateCase(caseId: string, rating: number, feedback?: string): Promise<void> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async getFeaturedCases(limit?: number): Promise<ValidationCase[]> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }

  async getTopExperts(category?: CaseCategory): Promise<Array<{
    name: string;
    expertise: string;
    casesContributed: number;
    averageRating: number;
  }>> {
    throw new Error('功能开发中 - 请关注 M6 阶段更新');
  }
}

// 导出所有公共 API
export default {
  CaseManager,
  CaseExecutor,
  ResultEvaluator,
  CommunityService,
  CaseCategory,
  DifficultyLevel
};

/**
 * 使用示例（规划中）：
 * 
 * ```typescript
 * import { CaseManager, CaseCategory, DifficultyLevel } from '@meteor-shower/capability-validation';
 * 
 * const caseManager = new CaseManager();
 * 
 * // 创建测试案例
 * const testCase = await caseManager.createCase({
 *   title: '逻辑陷阱识别',
 *   category: CaseCategory.LOGICAL_REASONING,
 *   difficulty: DifficultyLevel.ADVANCED,
 *   scenario: {
 *     context: '有一个著名的逻辑悖论',
 *     task: '请识别并解释其中的逻辑问题',
 *     input: '这句话是假的。',
 *   },
 *   expected: {
 *     type: 'criteria',
 *     criteria: ['识别悖论性质', '解释循环逻辑', '提出解决思路']
 *   }
 * });
 * 
 * // 执行案例
 * const executor = new CaseExecutor();
 * const result = await executor.executeCase(testCase.id, 'claude');
 * console.log(`执行结果评分: ${result.scores.overall}/100`);
 * 
 * // 获取专家案例
 * const expertCases = await caseManager.getCases({
 *   difficulty: DifficultyLevel.EXPERT,
 *   category: CaseCategory.CODE_GENERATION
 * });
 * ```
 * 
 * 核心价值：
 * - 专家贡献的高质量测试案例
 * - 标准化的模型能力评估体系
 * - 社区驱动的知识共享平台
 * - 配置效果的客观评估基准
 * 
 * 实施计划：
 * - Phase 1: 案例管理和执行引擎（2周）
 * - Phase 2: 评估体系和对比分析（1周）  
 * - Phase 3: 社区功能和专家认证（1周）
 * - Phase 4: UI界面和高级功能（1周）
 * 
 * 详细设计文档：CAPABILITY_VALIDATION_MODULE_DESIGN.md
 */