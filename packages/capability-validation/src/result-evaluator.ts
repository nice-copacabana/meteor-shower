/**
 * ResultEvaluator - 结果评估器
 * 
 * 负责评估AI工具执行结果的质量
 * 支持多种评估策略：精确匹配、模式匹配、标准匹配、创意评估
 */

import { ValidationCase, CaseExecution } from './index.js';

/**
 * 评估得分
 */
export interface EvaluationScores {
  accuracy: number;      // 准确性 (0-100)
  completeness: number;  // 完整性 (0-100)
  creativity: number;    // 创新性 (0-100)
  efficiency: number;    // 效率 (0-100)
  overall: number;       // 总分 (加权平均)
  customScores?: Record<string, number>; // 自定义评分
}

/**
 * 评估分析
 */
export interface EvaluationAnalysis {
  strengths: string[];    // 优势
  weaknesses: string[];   // 不足
  suggestions: string[];  // 改进建议
  passThreshold: number;  // 通过阈值
  passed: boolean;        // 是否通过
}

/**
 * 评估策略接口
 */
export interface EvaluationStrategy {
  name: string;
  evaluate(output: string, expected: ValidationCase['expected']): number;
}

/**
 * 精确匹配策略
 */
export class ExactMatchStrategy implements EvaluationStrategy {
  name = 'exact_match';

  evaluate(output: string, expected: ValidationCase['expected']): number {
    if (expected.type !== 'exact' || !expected.content) {
      return 0;
    }

    const outputNormalized = this.normalize(output);
    const expectedNormalized = this.normalize(expected.content);

    // 完全匹配得100分，否则按相似度计算
    if (outputNormalized === expectedNormalized) {
      return 100;
    }

    // 计算编辑距离相似度
    const similarity = this.calculateSimilarity(outputNormalized, expectedNormalized);
    return Math.max(0, similarity * 100);
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // 使用Levenshtein距离
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }
}

/**
 * 模式匹配策略
 */
export class PatternMatchStrategy implements EvaluationStrategy {
  name = 'pattern_match';

  evaluate(output: string, expected: ValidationCase['expected']): number {
    if (expected.type !== 'pattern' || !expected.pattern) {
      return 0;
    }

    try {
      const regex = new RegExp(expected.pattern, 'i');
      const matches = output.match(regex);

      if (matches) {
        // 基础分：找到匹配
        let score = 70;

        // 额外分：匹配覆盖度
        const matchedLength = matches[0].length;
        const outputLength = output.length;
        const coverage = matchedLength / outputLength;
        score += coverage * 30;

        return Math.min(100, score);
      }

      // 部分匹配检测
      const partialScore = this.checkPartialMatch(output, expected.pattern);
      return partialScore;

    } catch (error) {
      console.error('正则表达式错误:', error);
      return 0;
    }
  }

  private checkPartialMatch(output: string, pattern: string): number {
    // 尝试检测输出是否包含模式的部分元素
    const keywords = pattern
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length > 2);

    let matchCount = 0;
    for (const keyword of keywords) {
      if (output.toLowerCase().includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return keywords.length > 0 
      ? (matchCount / keywords.length) * 50 
      : 0;
  }
}

/**
 * 标准匹配策略
 */
export class CriteriaMatchStrategy implements EvaluationStrategy {
  name = 'criteria_match';

  evaluate(output: string, expected: ValidationCase['expected']): number {
    if (expected.type !== 'criteria' || !expected.criteria || expected.criteria.length === 0) {
      return 0;
    }

    const outputLower = output.toLowerCase();
    let matchedCriteria = 0;

    // 检查每个标准是否满足
    for (const criterion of expected.criteria) {
      if (this.checkCriterion(outputLower, criterion)) {
        matchedCriteria++;
      }
    }

    // 按匹配比例计分
    const score = (matchedCriteria / expected.criteria.length) * 100;
    return score;
  }

  private checkCriterion(output: string, criterion: string): boolean {
    // 提取标准中的关键词
    const keywords = criterion
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length > 2);

    // 如果大部分关键词都在输出中，认为满足标准
    let foundCount = 0;
    for (const keyword of keywords) {
      if (output.includes(keyword)) {
        foundCount++;
      }
    }

    return keywords.length > 0 && foundCount / keywords.length >= 0.6;
  }
}

/**
 * 创意评估策略
 */
export class CreativeEvaluationStrategy implements EvaluationStrategy {
  name = 'creative_evaluation';

  evaluate(output: string, expected: ValidationCase['expected']): number {
    if (expected.type !== 'creative') {
      return 0;
    }

    // 基于多个维度评估创意输出
    let score = 0;

    // 1. 长度合理性 (10分)
    const lengthScore = this.evaluateLength(output);
    score += lengthScore * 0.1;

    // 2. 结构完整性 (20分)
    const structureScore = this.evaluateStructure(output);
    score += structureScore * 0.2;

    // 3. 内容丰富度 (30分)
    const richnessScore = this.evaluateRichness(output);
    score += richnessScore * 0.3;

    // 4. 是否有示例对比 (40分)
    if (expected.examples && expected.examples.length > 0) {
      const exampleScore = this.compareWithExamples(output, expected.examples);
      score += exampleScore * 0.4;
    } else {
      // 如果没有示例，平均分配权重
      score = (lengthScore + structureScore + richnessScore) / 3;
    }

    return Math.min(100, score);
  }

  private evaluateLength(output: string): number {
    const length = output.length;
    if (length < 50) return 30; // 太短
    if (length < 200) return 60;
    if (length < 1000) return 100;
    if (length < 5000) return 90;
    return 70; // 太长可能冗余
  }

  private evaluateStructure(output: string): number {
    let score = 0;

    // 检查是否有段落
    if (output.includes('\n\n')) score += 30;

    // 检查是否有标题或强调
    if (/^#{1,6}\s/.test(output) || output.includes('**')) score += 20;

    // 检查是否有列表
    if (/^[\-\*\+]\s/m.test(output) || /^\d+\.\s/m.test(output)) score += 30;

    // 检查是否有代码块
    if (output.includes('```') || output.includes('`')) score += 20;

    return Math.min(100, score);
  }

  private evaluateRichness(output: string): number {
    // 统计不同类型的内容
    const words = output.split(/\s+/).length;
    const uniqueWords = new Set(output.toLowerCase().split(/\s+/)).size;
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    let score = 0;

    // 词汇丰富度
    if (uniqueWords > 50) score += 40;
    else if (uniqueWords > 20) score += 20;

    // 句子数量
    if (sentences > 10) score += 30;
    else if (sentences > 5) score += 15;

    // 词汇多样性
    const diversity = uniqueWords / Math.max(words, 1);
    score += diversity * 30;

    return Math.min(100, score);
  }

  private compareWithExamples(output: string, examples: string[]): number {
    let maxScore = 0;

    for (const example of examples) {
      const similarity = this.calculateSimilarity(output, example);
      maxScore = Math.max(maxScore, similarity * 100);
    }

    return maxScore;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

/**
 * 结果评估器
 */
export class ResultEvaluator {
  private strategies: Map<string, EvaluationStrategy>;

  constructor() {
    this.strategies = new Map();
    
    // 注册默认策略
    this.registerStrategy(new ExactMatchStrategy());
    this.registerStrategy(new PatternMatchStrategy());
    this.registerStrategy(new CriteriaMatchStrategy());
    this.registerStrategy(new CreativeEvaluationStrategy());
  }

  /**
   * 注册评估策略
   */
  registerStrategy(strategy: EvaluationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * 评估结果
   */
  async evaluateResult(
    validationCase: ValidationCase,
    output: string
  ): Promise<EvaluationScores> {
    // 选择对应的策略
    const strategyName = this.getStrategyName(validationCase.expected.type);
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      throw new Error(`未找到策略: ${strategyName}`);
    }

    // 执行主要评估
    const accuracyScore = strategy.evaluate(output, validationCase.expected);

    // 评估完整性
    const completenessScore = this.evaluateCompleteness(output, validationCase);

    // 评估创新性
    const creativityScore = this.evaluateCreativity(output, validationCase);

    // 评估效率（基于输出长度和质量）
    const efficiencyScore = this.evaluateEfficiency(output, accuracyScore);

    // 计算总分（加权平均）
    const weights = validationCase.scoring;
    const overall = (
      accuracyScore * (weights.accuracy / 100) +
      completenessScore * (weights.completeness / 100) +
      creativityScore * (weights.creativity / 100) +
      efficiencyScore * (weights.efficiency / 100)
    );

    return {
      accuracy: Math.round(accuracyScore),
      completeness: Math.round(completenessScore),
      creativity: Math.round(creativityScore),
      efficiency: Math.round(efficiencyScore),
      overall: Math.round(overall)
    };
  }

  /**
   * 生成评估分析
   */
  async analyzeResult(
    validationCase: ValidationCase,
    execution: CaseExecution
  ): Promise<EvaluationAnalysis> {
    const scores = execution.scores;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // 分析各维度得分
    if (scores.accuracy >= 80) {
      strengths.push('准确性优秀，输出符合预期');
    } else if (scores.accuracy < 60) {
      weaknesses.push('准确性不足，输出偏离预期');
      suggestions.push('检查输入理解是否正确，调整提示词');
    }

    if (scores.completeness >= 80) {
      strengths.push('完整性好，覆盖所有要点');
    } else if (scores.completeness < 60) {
      weaknesses.push('完整性欠缺，遗漏部分内容');
      suggestions.push('确保输出包含所有必需元素');
    }

    if (scores.creativity >= 70) {
      strengths.push('具有创新性，提供了独特见解');
    } else if (scores.creativity < 50) {
      weaknesses.push('创新性较低，缺乏新颖观点');
      suggestions.push('尝试提供更多创意性的解决方案');
    }

    if (scores.efficiency >= 70) {
      strengths.push('效率高，输出简洁有效');
    } else if (scores.efficiency < 50) {
      weaknesses.push('效率较低，输出过于冗长或简略');
      suggestions.push('优化输出长度，保持信息密度适中');
    }

    // 判断是否通过
    const difficulty = validationCase.difficulty;
    const thresholds: Record<string, number> = {
      'beginner': 60,
      'intermediate': 50,
      'advanced': 40,
      'expert': 30,
      'legendary': 20
    };
    const passThreshold = thresholds[difficulty] || 50;
    const passed = scores.overall >= passThreshold;

    return {
      strengths,
      weaknesses,
      suggestions,
      passThreshold,
      passed
    };
  }

  /**
   * 比较多个执行结果
   */
  async compareResults(executions: CaseExecution[]): Promise<{
    rankings: Array<{
      tool: string;
      model?: string;
      averageScore: number;
      strengths: string[];
    }>;
    insights: string[];
  }> {
    // 按总分排序
    const sorted = [...executions].sort((a, b) => b.scores.overall - a.scores.overall);

    const rankings = sorted.map((exec, index) => {
      const strengths: string[] = [];
      
      // 分析优势
      if (exec.scores.accuracy === Math.max(...executions.map(e => e.scores.accuracy))) {
        strengths.push('准确性最佳');
      }
      if (exec.scores.completeness === Math.max(...executions.map(e => e.scores.completeness))) {
        strengths.push('完整性最佳');
      }
      if (exec.scores.creativity === Math.max(...executions.map(e => e.scores.creativity))) {
        strengths.push('创新性最佳');
      }
      if (exec.scores.efficiency === Math.max(...executions.map(e => e.scores.efficiency))) {
        strengths.push('效率最佳');
      }

      return {
        tool: exec.tool,
        model: exec.model,
        averageScore: exec.scores.overall,
        strengths
      };
    });

    // 生成洞察
    const insights: string[] = [];
    if (rankings.length > 0) {
      insights.push(`最佳工具: ${rankings[0].tool} (得分: ${rankings[0].averageScore})`);
      
      const scoreDiff = rankings.length > 1 
        ? rankings[0].averageScore - rankings[1].averageScore
        : 0;
      
      if (scoreDiff > 20) {
        insights.push('第一名明显领先其他工具');
      } else if (scoreDiff < 5) {
        insights.push('多个工具表现接近，差异不明显');
      }
    }

    return { rankings, insights };
  }

  /**
   * 获取策略名称
   */
  private getStrategyName(expectedType: string): string {
    const mapping: Record<string, string> = {
      'exact': 'exact_match',
      'pattern': 'pattern_match',
      'criteria': 'criteria_match',
      'creative': 'creative_evaluation'
    };
    return mapping[expectedType] || 'criteria_match';
  }

  /**
   * 评估完整性
   */
  private evaluateCompleteness(output: string, validationCase: ValidationCase): number {
    let score = 50; // 基础分

    // 检查是否回答了主要问题
    const task = validationCase.scenario.task.toLowerCase();
    const outputLower = output.toLowerCase();

    // 提取任务关键词
    const taskKeywords = task
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    let keywordMatchCount = 0;
    for (const keyword of taskKeywords) {
      if (outputLower.includes(keyword)) {
        keywordMatchCount++;
      }
    }

    if (taskKeywords.length > 0) {
      score += (keywordMatchCount / taskKeywords.length) * 50;
    }

    return Math.min(100, score);
  }

  /**
   * 评估创新性
   */
  private evaluateCreativity(output: string, validationCase: ValidationCase): number {
    // 基于输出的多样性和独特性
    let score = 50;

    // 检查是否提供了多种方案或视角
    if (output.match(/方案|方法|方式/gi)?.length > 1) {
      score += 20;
    }

    // 检查是否有实例或案例
    if (output.match(/例如|比如|举例/gi)) {
      score += 15;
    }

    // 检查是否有对比或分析
    if (output.match(/相比|对比|与|对比/gi)) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * 评估效率
   */
  private evaluateEfficiency(output: string, accuracyScore: number): number {
    const length = output.length;
    
    // 基于长度和准确性的平衡
    let score = 0;

    if (accuracyScore >= 80) {
      // 准确性高时，简洁性更重要
      if (length < 500) score = 100;
      else if (length < 1500) score = 80;
      else if (length < 3000) score = 60;
      else score = 40;
    } else {
      // 准确性低时，可能需要更多解释
      if (length < 200) score = 50; // 太简略
      else if (length < 1000) score = 80;
      else if (length < 3000) score = 90;
      else score = 70;
    }

    return score;
  }
}
