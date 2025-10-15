/**
 * CategoryManager - 分类体系管理
 * 
 * 负责管理10个能力类别和5个难度等级的完整体系
 * 提供分类统计、难度分布、推荐等功能
 */

import Database from 'better-sqlite3';
import { 
  CaseCategory, 
  DifficultyLevel, 
  CATEGORY_METADATA, 
  DIFFICULTY_METADATA,
  ValidationCase 
} from './index.js';
import { ValidationCaseDAO } from './database/dao.js';

/**
 * 类别信息
 */
export interface CategoryInfo {
  category: CaseCategory;
  name: string;
  description: string;
  icon: string;
  examples: string[];
  stats?: {
    totalCases: number;
    averageScore: number;
    passRate: number;
  };
}

/**
 * 难度级别信息
 */
export interface DifficultyInfo {
  level: DifficultyLevel;
  name: string;
  description: string;
  scoreRange: [number, number];
  passThreshold: number;
  estimatedTime: string;
  stats?: {
    totalCases: number;
    averageScore: number;
    passRate: number;
  };
}

/**
 * 类别统计信息
 */
export interface CategoryStats {
  category: CaseCategory;
  totalCases: number;
  averageScore: number;
  passRate: number;
  difficultyDistribution: Record<DifficultyLevel, number>;
  topTags: Array<{ tag: string; count: number }>;
  recentCases: ValidationCase[];
}

/**
 * 难度分布统计
 */
export interface DifficultyStats {
  distribution: Record<DifficultyLevel, {
    count: number;
    percentage: number;
    averageScore: number;
  }>;
  total: number;
}

/**
 * 分类体系管理器
 */
export class CategoryManager {
  private db: Database.Database;
  private caseDAO: ValidationCaseDAO;

  constructor(db: Database.Database) {
    this.db = db;
    this.caseDAO = new ValidationCaseDAO(db);
  }

  /**
   * 获取所有类别信息
   */
  getCategoriesInfo(includeStats: boolean = false): CategoryInfo[] {
    const categories = Object.values(CaseCategory);
    
    return categories.map(category => {
      const metadata = CATEGORY_METADATA[category];
      const info: CategoryInfo = {
        category,
        name: metadata.name,
        description: metadata.description,
        icon: metadata.icon,
        examples: metadata.examples
      };

      if (includeStats) {
        const stats = this.caseDAO.getCategoryStats(category);
        if (stats.length > 0) {
          info.stats = {
            totalCases: stats[0].totalCases,
            averageScore: stats[0].averageScore,
            passRate: stats[0].passRate
          };
        } else {
          info.stats = {
            totalCases: 0,
            averageScore: 0,
            passRate: 0
          };
        }
      }

      return info;
    });
  }

  /**
   * 获取所有难度级别信息
   */
  getDifficultiesInfo(includeStats: boolean = false): DifficultyInfo[] {
    const difficulties = Object.values(DifficultyLevel);
    
    return difficulties.map(level => {
      const metadata = DIFFICULTY_METADATA[level];
      const info: DifficultyInfo = {
        level,
        name: metadata.name,
        description: metadata.description,
        scoreRange: metadata.scoreRange,
        passThreshold: metadata.passThreshold,
        estimatedTime: metadata.estimatedTime
      };

      if (includeStats) {
        const stmt = this.db.prepare(`
          SELECT 
            COUNT(*) as total_cases,
            AVG(stats_average_score) as avg_score,
            AVG(stats_pass_rate) as avg_pass_rate
          FROM validation_cases
          WHERE difficulty = ?
        `);
        const row = stmt.get(level) as any;
        
        info.stats = {
          totalCases: row.total_cases || 0,
          averageScore: row.avg_score || 0,
          passRate: row.avg_pass_rate || 0
        };
      }

      return info;
    });
  }

  /**
   * 获取类别统计信息（详细版）
   */
  getCategoryStats(category: CaseCategory): CategoryStats {
    const baseStats = this.caseDAO.getCategoryStats(category);
    
    if (baseStats.length === 0) {
      return {
        category,
        totalCases: 0,
        averageScore: 0,
        passRate: 0,
        difficultyDistribution: {} as Record<DifficultyLevel, number>,
        topTags: [],
        recentCases: []
      };
    }

    const stat = baseStats[0];

    // 获取热门标签
    const topTags = this.getTopTagsForCategory(category, 10);

    // 获取最新案例
    const recentCases = this.caseDAO.findAdvanced({
      category,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pageSize: 5
    });

    return {
      category: stat.category,
      totalCases: stat.totalCases,
      averageScore: stat.averageScore,
      passRate: stat.passRate,
      difficultyDistribution: stat.difficultyDistribution as Record<DifficultyLevel, number>,
      topTags,
      recentCases
    };
  }

  /**
   * 获取难度分布统计
   */
  getDifficultyDistribution(category?: CaseCategory): DifficultyStats {
    let sql = `
      SELECT 
        difficulty,
        COUNT(*) as count,
        AVG(stats_average_score) as avg_score
      FROM validation_cases
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' GROUP BY difficulty';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const distribution: Record<DifficultyLevel, any> = {} as any;

    rows.forEach(row => {
      distribution[row.difficulty as DifficultyLevel] = {
        count: row.count,
        percentage: total > 0 ? (row.count / total) * 100 : 0,
        averageScore: row.avg_score || 0
      };
    });

    // 确保所有难度级别都有数据（即使是0）
    Object.values(DifficultyLevel).forEach(level => {
      if (!distribution[level]) {
        distribution[level] = {
          count: 0,
          percentage: 0,
          averageScore: 0
        };
      }
    });

    return {
      distribution,
      total
    };
  }

  /**
   * 推荐类别（基于用户历史和热门程度）
   */
  recommendCategories(userId?: string, limit: number = 5): CaseCategory[] {
    // TODO: 实现基于用户历史的个性化推荐
    // 目前返回案例数量最多的类别
    
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM validation_cases
      WHERE is_public = 1
      GROUP BY category
      ORDER BY count DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(row => row.category as CaseCategory);
  }

  /**
   * 获取类别的热门标签
   */
  private getTopTagsForCategory(category: CaseCategory, limit: number = 10): Array<{ tag: string; count: number }> {
    const stmt = this.db.prepare(`
      SELECT tags
      FROM validation_cases
      WHERE category = ?
    `);
    
    const rows = stmt.all(category) as any[];
    const tagCounts = new Map<string, number>();

    rows.forEach(row => {
      const tags = JSON.parse(row.tags) as string[];
      tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 获取类别对比数据
   */
  getCategoryComparison(): Array<{
    category: CaseCategory;
    name: string;
    icon: string;
    totalCases: number;
    averageScore: number;
    passRate: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const categories = this.getCategoriesInfo(true);
    
    return categories.map(cat => ({
      category: cat.category,
      name: cat.name,
      icon: cat.icon,
      totalCases: cat.stats?.totalCases || 0,
      averageScore: cat.stats?.averageScore || 0,
      passRate: cat.stats?.passRate || 0,
      trend: 'stable' as 'up' | 'down' | 'stable' // TODO: 实现趋势计算
    }));
  }

  /**
   * 获取难度级别对比数据
   */
  getDifficultyComparison(): Array<{
    level: DifficultyLevel;
    name: string;
    totalCases: number;
    averageScore: number;
    passRate: number;
    passThreshold: number;
  }> {
    const difficulties = this.getDifficultiesInfo(true);
    
    return difficulties.map(diff => ({
      level: diff.level,
      name: diff.name,
      totalCases: diff.stats?.totalCases || 0,
      averageScore: diff.stats?.averageScore || 0,
      passRate: diff.stats?.passRate || 0,
      passThreshold: diff.passThreshold
    }));
  }

  /**
   * 获取全局统计概览
   */
  getGlobalOverview(): {
    totalCases: number;
    totalCategories: number;
    totalDifficulties: number;
    averageScore: number;
    passRate: number;
    categoryDistribution: Record<CaseCategory, number>;
    difficultyDistribution: Record<DifficultyLevel, number>;
  } {
    const totalStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_cases,
        AVG(stats_average_score) as avg_score,
        AVG(stats_pass_rate) as avg_pass_rate
      FROM validation_cases
    `);
    const totalRow = totalStmt.get() as any;

    const categoryDistStmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM validation_cases
      GROUP BY category
    `);
    const categoryRows = categoryDistStmt.all() as any[];
    const categoryDistribution: Record<CaseCategory, number> = {} as any;
    categoryRows.forEach(row => {
      categoryDistribution[row.category as CaseCategory] = row.count;
    });

    const difficultyDistStmt = this.db.prepare(`
      SELECT difficulty, COUNT(*) as count
      FROM validation_cases
      GROUP BY difficulty
    `);
    const difficultyRows = difficultyDistStmt.all() as any[];
    const difficultyDistribution: Record<DifficultyLevel, number> = {} as any;
    difficultyRows.forEach(row => {
      difficultyDistribution[row.difficulty as DifficultyLevel] = row.count;
    });

    return {
      totalCases: totalRow.total_cases || 0,
      totalCategories: Object.keys(CaseCategory).length,
      totalDifficulties: Object.keys(DifficultyLevel).length,
      averageScore: totalRow.avg_score || 0,
      passRate: totalRow.avg_pass_rate || 0,
      categoryDistribution,
      difficultyDistribution
    };
  }
}
