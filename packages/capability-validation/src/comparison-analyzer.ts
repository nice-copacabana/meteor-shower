/**
 * ComparisonAnalyzer - 对比分析器
 * 
 * 负责跨工具对比分析，生成详细的对比报告
 * 支持多维度分析、可视化图表、导出功能
 */

import { ValidationCase, CaseExecution, CaseCategory, DifficultyLevel } from './index.js';
import { CaseExecutionDAO } from './database/dao.js';
import Database from 'better-sqlite3';

/**
 * 对比报告
 */
export interface ComparisonReport {
  caseId: string;
  caseTitle: string;
  caseCategory: CaseCategory;
  caseDifficulty: DifficultyLevel;
  executions: CaseExecution[];
  ranking: RankingEntry[];
  insights: ComparisonInsights;
  recommendations: string[];
  generatedAt: Date;
}

/**
 * 排名条目
 */
export interface RankingEntry {
  rank: number;
  tool: string;
  model?: string;
  scores: {
    accuracy: number;
    completeness: number;
    creativity: number;
    efficiency: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
}

/**
 * 对比洞察
 */
export interface ComparisonInsights {
  bestTool: string;
  bestModel?: string;
  averageScore: number;
  scoreVariance: number;
  dimensionLeaders: {
    accuracy: string;
    completeness: string;
    creativity: string;
    efficiency: string;
  };
  consistencyAnalysis: string;
  valueAnalysis?: string; // 性价比分析
}

/**
 * 批量对比报告
 */
export interface BatchComparisonReport {
  cases: ComparisonReport[];
  summary: {
    totalCases: number;
    toolRankings: Array<{
      tool: string;
      averageScore: number;
      winCount: number;
      averageRank: number;
    }>;
    categoryPerformance: Record<CaseCategory, {
      bestTool: string;
      averageScore: number;
    }>;
    recommendations: string[];
  };
  generatedAt: Date;
}

/**
 * 对比分析器
 */
export class ComparisonAnalyzer {
  private db: Database.Database;
  private executionDAO: CaseExecutionDAO;

  constructor(db: Database.Database) {
    this.db = db;
    this.executionDAO = new CaseExecutionDAO(db);
  }

  /**
   * 生成单案例对比报告
   */
  async generateReport(
    validationCase: ValidationCase,
    executions: CaseExecution[]
  ): Promise<ComparisonReport> {
    // 按总分排序
    const sorted = [...executions].sort((a, b) => b.scores.overall - a.scores.overall);

    // 生成排名
    const ranking = sorted.map((exec, index) => this.createRankingEntry(exec, index + 1, executions));

    // 生成洞察
    const insights = this.generateInsights(executions);

    // 生成推荐
    const recommendations = this.generateRecommendations(validationCase, executions, insights);

    return {
      caseId: validationCase.id,
      caseTitle: validationCase.title,
      caseCategory: validationCase.category,
      caseDifficulty: validationCase.difficulty,
      executions,
      ranking,
      insights,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * 生成批量对比报告
   */
  async generateBatchReport(caseIds: string[], tools: string[]): Promise<BatchComparisonReport> {
    const reports: ComparisonReport[] = [];

    // 为每个案例生成报告
    for (const caseId of caseIds) {
      const executions = this.executionDAO.findByCaseId(caseId);
      
      // 过滤指定工具
      const filteredExecutions = executions.filter(e => tools.includes(e.tool));
      
      if (filteredExecutions.length > 0) {
        // 需要ValidationCase，这里简化处理
        const report: ComparisonReport = {
          caseId,
          caseTitle: '案例标题', // TODO: 从数据库获取
          caseCategory: 'code_generation' as CaseCategory,
          caseDifficulty: 'intermediate' as DifficultyLevel,
          executions: filteredExecutions,
          ranking: [],
          insights: this.generateInsights(filteredExecutions),
          recommendations: [],
          generatedAt: new Date()
        };
        reports.push(report);
      }
    }

    // 生成汇总
    const summary = this.generateBatchSummary(reports, tools);

    return {
      cases: reports,
      summary,
      generatedAt: new Date()
    };
  }

  /**
   * 获取工具历史表现
   */
  async getToolPerformanceHistory(
    tool: string,
    category?: CaseCategory,
    limit: number = 100
  ): Promise<{
    tool: string;
    totalExecutions: number;
    averageScore: number;
    passRate: number;
    scoreDistribution: Record<string, number>; // 分数段分布
    trendData: Array<{
      date: Date;
      averageScore: number;
    }>;
  }> {
    const executions = this.executionDAO.findByTool(tool).slice(0, limit);

    if (executions.length === 0) {
      return {
        tool,
        totalExecutions: 0,
        averageScore: 0,
        passRate: 0,
        scoreDistribution: {},
        trendData: []
      };
    }

    // 计算平均分
    const averageScore = executions.reduce((sum, e) => sum + e.scores.overall, 0) / executions.length;

    // 计算通过率 (假设60分及格)
    const passedCount = executions.filter(e => e.scores.overall >= 60).length;
    const passRate = (passedCount / executions.length) * 100;

    // 分数段分布
    const scoreDistribution: Record<string, number> = {
      '0-20': 0,
      '20-40': 0,
      '40-60': 0,
      '60-80': 0,
      '80-100': 0
    };

    executions.forEach(e => {
      const score = e.scores.overall;
      if (score < 20) scoreDistribution['0-20']++;
      else if (score < 40) scoreDistribution['20-40']++;
      else if (score < 60) scoreDistribution['40-60']++;
      else if (score < 80) scoreDistribution['60-80']++;
      else scoreDistribution['80-100']++;
    });

    // 趋势数据
    const trendData = this.calculateTrend(executions);

    return {
      tool,
      totalExecutions: executions.length,
      averageScore,
      passRate,
      scoreDistribution,
      trendData
    };
  }

  /**
   * 生成可视化数据
   */
  async generateChartData(report: ComparisonReport): Promise<{
    radarChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
    barChart: {
      labels: string[];
      data: number[];
    };
  }> {
    const labels = ['准确性', '完整性', '创新性', '效率'];

    // 雷达图数据（多工具对比）
    const radarDatasets = report.ranking.map(entry => ({
      label: entry.tool + (entry.model ? ` (${entry.model})` : ''),
      data: [
        entry.scores.accuracy,
        entry.scores.completeness,
        entry.scores.creativity,
        entry.scores.efficiency
      ]
    }));

    // 柱状图数据（总分对比）
    const barLabels = report.ranking.map(entry => entry.tool);
    const barData = report.ranking.map(entry => entry.scores.overall);

    return {
      radarChart: {
        labels,
        datasets: radarDatasets
      },
      barChart: {
        labels: barLabels,
        data: barData
      }
    };
  }

  /**
   * 导出报告为Markdown
   */
  exportToMarkdown(report: ComparisonReport): string {
    let markdown = `# 案例对比分析报告\n\n`;
    markdown += `## 案例信息\n\n`;
    markdown += `- **标题**: ${report.caseTitle}\n`;
    markdown += `- **类别**: ${report.caseCategory}\n`;
    markdown += `- **难度**: ${report.caseDifficulty}\n`;
    markdown += `- **生成时间**: ${report.generatedAt.toLocaleString()}\n\n`;

    markdown += `## 工具排名\n\n`;
    markdown += `| 排名 | 工具 | 准确性 | 完整性 | 创新性 | 效率 | 总分 |\n`;
    markdown += `|------|------|--------|--------|--------|------|------|\n`;

    report.ranking.forEach(entry => {
      markdown += `| ${entry.rank} | ${entry.tool}${entry.model ? ` (${entry.model})` : ''} `;
      markdown += `| ${entry.scores.accuracy.toFixed(1)} `;
      markdown += `| ${entry.scores.completeness.toFixed(1)} `;
      markdown += `| ${entry.scores.creativity.toFixed(1)} `;
      markdown += `| ${entry.scores.efficiency.toFixed(1)} `;
      markdown += `| **${entry.scores.overall.toFixed(1)}** |\n`;
    });

    markdown += `\n## 对比洞察\n\n`;
    markdown += `- **最佳工具**: ${report.insights.bestTool}\n`;
    markdown += `- **平均得分**: ${report.insights.averageScore.toFixed(2)}\n`;
    markdown += `- **得分方差**: ${report.insights.scoreVariance.toFixed(2)}\n`;
    markdown += `- **一致性分析**: ${report.insights.consistencyAnalysis}\n\n`;

    markdown += `### 各维度领先者\n\n`;
    markdown += `- 准确性: ${report.insights.dimensionLeaders.accuracy}\n`;
    markdown += `- 完整性: ${report.insights.dimensionLeaders.completeness}\n`;
    markdown += `- 创新性: ${report.insights.dimensionLeaders.creativity}\n`;
    markdown += `- 效率: ${report.insights.dimensionLeaders.efficiency}\n\n`;

    markdown += `## 推荐建议\n\n`;
    report.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });

    return markdown;
  }

  /**
   * 创建排名条目
   */
  private createRankingEntry(
    execution: CaseExecution,
    rank: number,
    allExecutions: CaseExecution[]
  ): RankingEntry {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 分析优势
    if (execution.scores.accuracy === Math.max(...allExecutions.map(e => e.scores.accuracy))) {
      strengths.push('准确性最佳');
    }
    if (execution.scores.completeness === Math.max(...allExecutions.map(e => e.scores.completeness))) {
      strengths.push('完整性最佳');
    }
    if (execution.scores.creativity === Math.max(...allExecutions.map(e => e.scores.creativity))) {
      strengths.push('创新性最佳');
    }
    if (execution.scores.efficiency === Math.max(...allExecutions.map(e => e.scores.efficiency))) {
      strengths.push('效率最佳');
    }

    // 分析弱点
    if (execution.scores.accuracy === Math.min(...allExecutions.map(e => e.scores.accuracy))) {
      weaknesses.push('准确性较弱');
    }
    if (execution.scores.completeness === Math.min(...allExecutions.map(e => e.scores.completeness))) {
      weaknesses.push('完整性较弱');
    }

    return {
      rank,
      tool: execution.tool,
      model: execution.model,
      scores: execution.scores,
      strengths,
      weaknesses
    };
  }

  /**
   * 生成洞察
   */
  private generateInsights(executions: CaseExecution[]): ComparisonInsights {
    if (executions.length === 0) {
      throw new Error('无执行记录');
    }

    const sorted = [...executions].sort((a, b) => b.scores.overall - a.scores.overall);
    const best = sorted[0];

    // 计算平均分和方差
    const scores = executions.map(e => e.scores.overall);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / scores.length;

    // 找出各维度领先者
    const dimensionLeaders = {
      accuracy: this.findDimensionLeader(executions, 'accuracy'),
      completeness: this.findDimensionLeader(executions, 'completeness'),
      creativity: this.findDimensionLeader(executions, 'creativity'),
      efficiency: this.findDimensionLeader(executions, 'efficiency')
    };

    // 一致性分析
    let consistencyAnalysis: string;
    if (variance < 50) {
      consistencyAnalysis = '各工具表现非常接近，差异较小';
    } else if (variance < 200) {
      consistencyAnalysis = '各工具表现存在一定差异';
    } else {
      consistencyAnalysis = '各工具表现差异明显';
    }

    return {
      bestTool: best.tool,
      bestModel: best.model,
      averageScore,
      scoreVariance: variance,
      dimensionLeaders,
      consistencyAnalysis
    };
  }

  /**
   * 生成推荐
   */
  private generateRecommendations(
    validationCase: ValidationCase,
    executions: CaseExecution[],
    insights: ComparisonInsights
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`对于${validationCase.category}类型的${validationCase.difficulty}难度任务，推荐使用 ${insights.bestTool}`);

    if (insights.scoreVariance < 50) {
      recommendations.push('各工具表现接近，可根据成本和可用性选择');
    } else {
      recommendations.push(`${insights.bestTool} 在此类任务上有明显优势`);
    }

    // 根据维度领先者给出建议
    const leaders = insights.dimensionLeaders;
    if (leaders.accuracy !== insights.bestTool) {
      recommendations.push(`如果追求准确性，可考虑 ${leaders.accuracy}`);
    }
    if (leaders.creativity !== insights.bestTool) {
      recommendations.push(`如果追求创新性，可考虑 ${leaders.creativity}`);
    }

    return recommendations;
  }

  /**
   * 找出维度领先者
   */
  private findDimensionLeader(executions: CaseExecution[], dimension: keyof CaseExecution['scores']): string {
    const maxScore = Math.max(...executions.map(e => e.scores[dimension]));
    const leader = executions.find(e => e.scores[dimension] === maxScore);
    return leader?.tool || 'Unknown';
  }

  /**
   * 生成批量汇总
   */
  private generateBatchSummary(reports: ComparisonReport[], tools: string[]): BatchComparisonReport['summary'] {
    const toolStats = new Map<string, { scores: number[]; wins: number; ranks: number[] }>();

    // 初始化统计
    tools.forEach(tool => {
      toolStats.set(tool, { scores: [], wins: 0, ranks: [] });
    });

    // 收集数据
    reports.forEach(report => {
      if (report.ranking.length > 0) {
        const winner = report.ranking[0].tool;
        const winnerStats = toolStats.get(winner);
        if (winnerStats) winnerStats.wins++;

        report.ranking.forEach(entry => {
          const stats = toolStats.get(entry.tool);
          if (stats) {
            stats.scores.push(entry.scores.overall);
            stats.ranks.push(entry.rank);
          }
        });
      }
    });

    // 生成工具排名
    const toolRankings = Array.from(toolStats.entries()).map(([tool, stats]) => ({
      tool,
      averageScore: stats.scores.length > 0 
        ? stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length 
        : 0,
      winCount: stats.wins,
      averageRank: stats.ranks.length > 0
        ? stats.ranks.reduce((sum, r) => sum + r, 0) / stats.ranks.length
        : 0
    })).sort((a, b) => b.averageScore - a.averageScore);

    return {
      totalCases: reports.length,
      toolRankings,
      categoryPerformance: {} as any, // TODO: 实现
      recommendations: [
        `基于 ${reports.length} 个案例的测试，${toolRankings[0]?.tool || '未知'} 表现最佳`,
        `平均得分: ${toolRankings[0]?.averageScore.toFixed(2) || 0}`
      ]
    };
  }

  /**
   * 计算趋势
   */
  private calculateTrend(executions: CaseExecution[]): Array<{ date: Date; averageScore: number }> {
    // 按日期分组
    const grouped = new Map<string, number[]>();

    executions.forEach(exec => {
      const dateKey = exec.executedAt.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(exec.scores.overall);
    });

    // 计算每天平均分
    return Array.from(grouped.entries())
      .map(([dateStr, scores]) => ({
        date: new Date(dateStr),
        averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
