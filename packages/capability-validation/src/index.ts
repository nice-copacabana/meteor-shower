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

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { ValidationCaseDAO, CaseExecutionDAO, CaseVersionDAO } from './database/dao.js';
import { initializeCaseDatabase } from './database/schema.js';
import { CategoryManager } from './category-manager.js';
import { ExecutionEngine, ToolAdapter } from './execution-engine.js';

/**
 * 测试案例类别枚举（10个核心能力类别）
 * 根据M7实施计划定义，覆盖AI工具的主要能力维度
 */
export enum CaseCategory {
  CODE_GENERATION = 'code_generation',       // 代码生成 - 生成代码片段或完整功能
  LOGICAL_REASONING = 'logical_reasoning',   // 逻辑推理 - 复杂逻辑问题求解
  CREATIVE_WRITING = 'creative_writing',     // 创意写作 - 文学创作和内容生成
  PROBLEM_SOLVING = 'problem_solving',       // 问题解决 - 综合问题解决能力
  DATA_ANALYSIS = 'data_analysis',           // 数据分析 - 数据处理和洞察（新增）
  TRANSLATION = 'translation',               // 翻译润色 - 多语言翻译和文本优化（新增）
  KNOWLEDGE_QA = 'knowledge_qa',             // 知识问答 - 专业知识问答（新增）
  CONVERSATION = 'conversation',             // 对话理解 - 对话理解和上下文把握（新增）
  CODE_REVIEW = 'code_review',               // 代码审查 - 代码质量评估（新增）
  DOCUMENTATION = 'documentation'            // 文档生成 - 技术文档编写（新增）
}

/**
 * 类别元数据
 */
export const CATEGORY_METADATA: Record<CaseCategory, {
  name: string;
  description: string;
  icon: string;
  examples: string[];
}> = {
  [CaseCategory.CODE_GENERATION]: {
    name: '代码生成',
    description: '测试AI生成代码片段、函数或完整功能模块的能力',
    icon: '💻',
    examples: ['生成排序算法', '实现API接口', '创建数据结构']
  },
  [CaseCategory.LOGICAL_REASONING]: {
    name: '逻辑推理',
    description: '评估AI处理复杂逻辑问题、推理和演绎的能力',
    icon: '🧠',
    examples: ['逻辑谜题', '因果推理', '悖论分析']
  },
  [CaseCategory.CREATIVE_WRITING]: {
    name: '创意写作',
    description: '考察AI的文学创作、内容生成和创意表达能力',
    icon: '✍️',
    examples: ['故事创作', '诗歌生成', '广告文案']
  },
  [CaseCategory.PROBLEM_SOLVING]: {
    name: '问题解决',
    description: '测试AI分析问题、设计方案并解决实际问题的综合能力',
    icon: '🔧',
    examples: ['系统设计', '优化方案', '故障排查']
  },
  [CaseCategory.DATA_ANALYSIS]: {
    name: '数据分析',
    description: '评估AI处理数据、提取洞察和进行数据可视化的能力',
    icon: '📊',
    examples: ['数据清洗', '趋势分析', '报表生成']
  },
  [CaseCategory.TRANSLATION]: {
    name: '翻译润色',
    description: '考察AI的多语言翻译、本地化和文本优化能力',
    icon: '🌐',
    examples: ['中英互译', '专业术语翻译', '文本润色']
  },
  [CaseCategory.KNOWLEDGE_QA]: {
    name: '知识问答',
    description: '测试AI在特定领域的专业知识储备和问答能力',
    icon: '📚',
    examples: ['技术问答', '历史知识', '科学解释']
  },
  [CaseCategory.CONVERSATION]: {
    name: '对话理解',
    description: '评估AI理解对话上下文、维持连贯对话的能力',
    icon: '💬',
    examples: ['多轮对话', '上下文理解', '意图识别']
  },
  [CaseCategory.CODE_REVIEW]: {
    name: '代码审查',
    description: '考察AI审查代码质量、发现问题并提出改进建议的能力',
    icon: '🔍',
    examples: ['代码质量评估', '安全漏洞检测', '性能优化建议']
  },
  [CaseCategory.DOCUMENTATION]: {
    name: '文档生成',
    description: '测试AI编写技术文档、API文档和用户手册的能力',
    icon: '📝',
    examples: ['API文档', '用户指南', '技术规范']
  }
}

/**
 * 案例难度等级（5个等级）
 * 根据M7实施计划定义，从入门到传奇级
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',     // 入门级 - 基础能力测试
  INTERMEDIATE = 'intermediate', // 进阶级 - 中等难度挑战
  ADVANCED = 'advanced',     // 专家级 - 高难度专业测试
  EXPERT = 'expert',         // 大师级 - 极具挑战性的案例
  LEGENDARY = 'legendary'    // 传奇级 - 业界难题级别
}

/**
 * 难度等级元数据
 */
export const DIFFICULTY_METADATA: Record<DifficultyLevel, {
  name: string;
  description: string;
  scoreRange: [number, number]; // 期望得分范围
  passThreshold: number;        // 通过阈值
  estimatedTime: string;        // 预计用时
}> = {
  [DifficultyLevel.BEGINNER]: {
    name: '入门级',
    description: '基础能力测试，适合初学者和快速验证',
    scoreRange: [60, 100],
    passThreshold: 60,
    estimatedTime: '1-5分钟'
  },
  [DifficultyLevel.INTERMEDIATE]: {
    name: '进阶级',
    description: '中等难度挑战，需要较好的理解和应用能力',
    scoreRange: [50, 90],
    passThreshold: 50,
    estimatedTime: '5-15分钟'
  },
  [DifficultyLevel.ADVANCED]: {
    name: '专家级',
    description: '高难度专业测试，要求深入的专业知识',
    scoreRange: [40, 80],
    passThreshold: 40,
    estimatedTime: '15-30分钟'
  },
  [DifficultyLevel.EXPERT]: {
    name: '大师级',
    description: '极具挑战性的案例，测试极限能力',
    scoreRange: [30, 70],
    passThreshold: 30,
    estimatedTime: '30-60分钟'
  },
  [DifficultyLevel.LEGENDARY]: {
    name: '传奇级',
    description: '业界难题级别，可能无完美解决方案',
    scoreRange: [20, 60],
    passThreshold: 20,
    estimatedTime: '60+分钟'
  }
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
 * 案例查询过滤器
 */
export interface CaseFilters {
  // 基本过滤
  category?: CaseCategory | CaseCategory[];
  difficulty?: DifficultyLevel | DifficultyLevel[];
  tags?: string[];
  author?: string;
  
  // 状态过滤
  isPublic?: boolean;
  isCertified?: boolean;
  
  // 评分过滤
  minAverageScore?: number;
  minPassRate?: number;
  
  // 时间范围
  createdAfter?: Date;
  createdBefore?: Date;
  
  // 排序
  sortBy?: 'createdAt' | 'updatedAt' | 'submissions' | 'averageScore' | 'passRate';
  sortOrder?: 'asc' | 'desc';
  
  // 分页
  page?: number;
  pageSize?: number;
}

/**
 * 案例搜索选项
 */
export interface SearchOptions {
  query: string;           // 搜索关键词
  fields?: ('title' | 'description' | 'tags')[]; // 搜索字段
  filters?: CaseFilters;   // 额外过滤条件
  limit?: number;          // 结果数量限制
}

/**
 * 案例版本信息
 */
export interface CaseVersion {
  version: string;
  caseId: string;
  changes: string;         // 变更说明
  createdAt: Date;
  createdBy: string;
}

/**
 * 案例管理器
 */
export class CaseManager {
  private db: Database.Database;
  private caseDAO: ValidationCaseDAO;
  private executionDAO: CaseExecutionDAO;
  private versionDAO: CaseVersionDAO;
  public readonly categoryManager: CategoryManager;
  public readonly executionEngine: ExecutionEngine;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    initializeCaseDatabase(this.db);
    this.caseDAO = new ValidationCaseDAO(this.db);
    this.executionDAO = new CaseExecutionDAO(this.db);
    this.versionDAO = new CaseVersionDAO(this.db);
    this.categoryManager = new CategoryManager(this.db);
    this.executionEngine = new ExecutionEngine(this.db);
  }

  async createCase(caseData: Partial<ValidationCase>): Promise<ValidationCase> {
    const id = caseData.id || nanoid();
    
    const validationCase: Omit<ValidationCase, 'createdAt' | 'updatedAt' | 'stats'> = {
      id,
      title: caseData.title || '',
      description: caseData.description || '',
      category: caseData.category || CaseCategory.CUSTOM,
      difficulty: caseData.difficulty || DifficultyLevel.INTERMEDIATE,
      tags: caseData.tags || [],
      scenario: caseData.scenario || {
        context: '',
        task: '',
        input: '',
      },
      expected: caseData.expected || {
        type: 'criteria',
        criteria: [],
      },
      scoring: caseData.scoring || {
        accuracy: 25,
        completeness: 25,
        creativity: 25,
        efficiency: 25,
      },
      author: caseData.author || {
        name: 'Anonymous',
      },
      version: caseData.version || '1.0.0',
      isPublic: caseData.isPublic !== undefined ? caseData.isPublic : true,
      isCertified: caseData.isCertified || false,
    };

    return this.caseDAO.create(validationCase);
  }

  async getCases(filter?: CaseFilters): Promise<ValidationCase[]> {
    // 使用高级查询方法
    return this.caseDAO.findAdvanced(filter);
  }

  async searchCases(options: SearchOptions): Promise<ValidationCase[]> {
    const { query, fields = ['title', 'description', 'tags'], filters, limit = 20 } = options;
    const allCases = await this.getCases(filters);
    
    // 关键词匹配（未来可集成全文搜索引擎）
    const queryLower = query.toLowerCase();
    return allCases.filter(c => {
      if (fields.includes('title') && c.title.toLowerCase().includes(queryLower)) return true;
      if (fields.includes('description') && c.description.toLowerCase().includes(queryLower)) return true;
      if (fields.includes('tags') && c.tags.some(tag => tag.toLowerCase().includes(queryLower))) return true;
      return false;
    }).slice(0, limit);
  }

  async getCaseById(caseId: string): Promise<ValidationCase | null> {
    return this.caseDAO.findById(caseId);
  }

  async updateCase(caseId: string, updates: Partial<ValidationCase>): Promise<ValidationCase> {
    const success = this.caseDAO.update(caseId, updates);
    if (!success) {
      throw new Error(`案例 ${caseId} 不存在或更新失败`);
    }
    
    const updated = this.caseDAO.findById(caseId);
    if (!updated) {
      throw new Error(`更新后无法找到案例 ${caseId}`);
    }
    
    return updated;
  }

  async deleteCase(caseId: string): Promise<void> {
    const success = this.caseDAO.delete(caseId);
    if (!success) {
      throw new Error(`案例 ${caseId} 不存在`);
    }
  }
  
  /**
   * 注册工具适配器
   */
  registerToolAdapter(adapter: ToolAdapter): void {
    this.executionEngine.registerAdapter(adapter);
  }
  
  /**
   * 获取案例执行记录
   */
  async getCaseExecutions(caseId: string): Promise<CaseExecution[]> {
    return this.executionDAO.findByCaseId(caseId);
  }
  
  /**
   * 获取案例版本历史
   */
  async getCaseVersions(caseId: string): Promise<CaseVersion[]> {
    return this.versionDAO.findByCaseId(caseId);
  }
  
  /**
   * 回滚到指定版本
   */
  async revertToVersion(caseId: string, version: string): Promise<ValidationCase> {
    // 获取版本快照
    const snapshot = this.versionDAO.getSnapshot(caseId, version);
    if (!snapshot) {
      throw new Error(`未找到版本 ${version}`);
    }
    
    // 先保存当前版本作为备份
    const currentCase = await this.getCaseById(caseId);
    if (currentCase) {
      await this.createVersion(caseId, `backup_${Date.now()}`, `回滚前的备份`, 'system');
    }
    
    // 更新案例为快照内容
    const success = this.caseDAO.update(caseId, snapshot);
    if (!success) {
      throw new Error(`回滚失败: 无法更新案例 ${caseId}`);
    }
    
    // 创建回滚记录
    await this.createVersion(caseId, snapshot.version, `回滚到版本 ${version}`, 'system');
    
    const updated = this.caseDAO.findById(caseId);
    if (!updated) {
      throw new Error(`回滚后无法找到案例 ${caseId}`);
    }
    
    return updated;
  }
  
  /**
   * 创建版本记录（内部使用）
   */
  private async createVersion(caseId: string, version: string, changes: string, createdBy: string): Promise<void> {
    const caseData = await this.getCaseById(caseId);
    if (!caseData) {
      throw new Error(`案例 ${caseId} 不存在`);
    }
    
    this.versionDAO.create(
      { caseId, version, changes, createdBy },
      caseData
    );
  }
  
  /**
   * 获取所有类别信息
   */
  getCategoryInfo(): typeof CATEGORY_METADATA {
    return CATEGORY_METADATA;
  }
  
  /**
   * 获取所有难度级别信息
   */
  getDifficultyInfo(): typeof DIFFICULTY_METADATA {
    return DIFFICULTY_METADATA;
  }
  
  /**
   * 获取类别统计信息
   */
  async getCategoryStats(category?: CaseCategory): Promise<{
    category: CaseCategory;
    totalCases: number;
    averageScore: number;
    passRate: number;
    difficultyDistribution: Record<DifficultyLevel, number>;
  }[]> {
    return this.caseDAO.getCategoryStats(category);
  }
  
  /**
   * 获取案例总数（支持过滤）
   */
  async getCaseCount(filter?: CaseFilters): Promise<number> {
    return this.caseDAO.count(filter);
  }
  
  /**
   * 关闭数据库
   */
  close(): void {
    this.db.close();
  }
}

/**
 * 案例执行器（已集成到CaseManager）
 * @deprecated 使用 CaseManager.executionEngine 替代
 */
export class CaseExecutor {
  constructor() {
    console.warn('CaseExecutor 已废弃，请使用 CaseManager.executionEngine');
  }

  async executeCase(
    caseId: string, 
    tool: string, 
    config?: Record<string, any>
  ): Promise<CaseExecution> {
    throw new Error('请使用 CaseManager.executionEngine.executeCase()');
  }

  async batchExecute(
    caseIds: string[], 
    tools: string[]
  ): Promise<CaseExecution[]> {
    throw new Error('请使用 CaseManager.executionEngine.batchExecute()');
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
export { CategoryManager } from './category-manager.js';
export type { CategoryInfo, DifficultyInfo, CategoryStats, DifficultyStats } from './category-manager.js';
export { ExecutionEngine, MockToolAdapter, GenericToolAdapter } from './execution-engine.js';
export type { ExecutionParams, BatchExecutionParams, ExecutionContext, ToolAdapter } from './execution-engine.js';

export default {
  CaseManager,
  CategoryManager,
  ExecutionEngine,
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