/**
 * 配置验证器模块
 * 提供配置文件的验证、检查和质量保证功能
 *
 * 核心功能：
 * - JSON Schema验证
 * - 配置完整性检查
 * - 安全规则验证
 * - 依赖关系检查
 * - 最佳实践建议
 */

import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import chalk from 'chalk';

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  score: number; // 0-100
  summary: string;
}

// 验证错误接口
export interface ValidationError {
  type: 'error';
  field?: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

// 验证警告接口
export interface ValidationWarning {
  type: 'warning';
  field?: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

// 验证建议接口
export interface ValidationSuggestion {
  type: 'suggestion';
  field?: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
}

// 验证规则接口
export interface ValidationRule {
  name: string;
  description: string;
  check: (config: any, context?: any) => ValidationResult | Promise<ValidationResult>;
  severity: 'error' | 'warning' | 'suggestion';
}

/**
 * 配置验证器类
 * 提供配置验证的核心功能
 */
export class ConfigValidator {
  private ajv: Ajv;
  private rules: ValidationRule[] = [];

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });

    this.initializeValidationRules();
  }

  /**
   * 初始化验证规则
   */
  private initializeValidationRules() {
    this.rules = [
      // 基础结构验证
      {
        name: 'required-fields',
        description: '检查必需字段',
        severity: 'error',
        check: this.checkRequiredFields.bind(this)
      },
      {
        name: 'json-schema',
        description: 'JSON Schema 验证',
        severity: 'error',
        check: this.checkJsonSchema.bind(this)
      },
      // 安全验证
      {
        name: 'security-check',
        description: '安全配置检查',
        severity: 'warning',
        check: this.checkSecuritySettings.bind(this)
      },
      // 最佳实践验证
      {
        name: 'best-practices',
        description: '最佳实践检查',
        severity: 'suggestion',
        check: this.checkBestPractices.bind(this)
      },
      // 工具特定验证
      {
        name: 'tool-specific',
        description: '工具特定配置验证',
        severity: 'warning',
        check: this.checkToolSpecificRules.bind(this)
      }
    ];
  }

  /**
   * 验证配置文件
   */
  async validateConfig(configPath: string, configContent?: string): Promise<ValidationResult> {
    try {
      let content: string;
      let config: any;

      // 读取配置文件
      if (configContent) {
        content = configContent;
      } else {
        content = await fs.readFile(configPath, 'utf-8');
      }

      // 解析JSON
      try {
        config = JSON.parse(content);
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            type: 'error',
            message: `JSON 格式错误: ${error.message}`,
            severity: 'high'
          }],
          warnings: [],
          suggestions: [],
          score: 0,
          summary: '配置文件格式错误'
        };
      }

      // 运行所有验证规则
      const allErrors: ValidationError[] = [];
      const allWarnings: ValidationWarning[] = [];
      const allSuggestions: ValidationSuggestion[] = [];
      let totalScore = 100;

      for (const rule of this.rules) {
        try {
          const result = await rule.check(config, { configPath, content });

          if (rule.severity === 'error') {
            allErrors.push(...result.errors);
            totalScore -= result.errors.length * 20; // 每个错误扣20分
          } else if (rule.severity === 'warning') {
            allWarnings.push(...result.warnings);
            totalScore -= result.warnings.length * 5; // 每个警告扣5分
          } else {
            allSuggestions.push(...result.suggestions);
          }
        } catch (error) {
          console.warn(chalk.yellow(`验证规则 ${rule.name} 执行失败: ${error.message}`));
        }
      }

      // 确保分数在0-100范围内
      totalScore = Math.max(0, Math.min(100, totalScore));

      const isValid = allErrors.length === 0;
      const summary = this.generateValidationSummary(isValid, allErrors.length, allWarnings.length, allSuggestions.length);

      return {
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        suggestions: allSuggestions,
        score: Math.round(totalScore),
        summary
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'error',
          message: `无法读取配置文件: ${error.message}`,
          severity: 'high'
        }],
        warnings: [],
        suggestions: [],
        score: 0,
        summary: '配置文件无法访问'
      };
    }
  }

  /**
   * 检查必需字段
   */
  private async checkRequiredFields(config: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const requiredFields = ['project', 'version', 'ai.provider', 'ai.model'];

    for (const field of requiredFields) {
      const value = this.getNestedValue(config, field);
      if (!value) {
        errors.push({
          type: 'error',
          field,
          message: `必需字段缺失: ${field}`,
          severity: 'high',
          suggestion: `请提供 ${field} 的值`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: [],
      score: errors.length === 0 ? 100 : 0,
      summary: `必需字段检查: ${errors.length} 个错误`
    };
  }

  /**
   * JSON Schema 验证
   */
  private async checkJsonSchema(config: any): Promise<ValidationResult> {
    try {
      // 使用内置的配置Schema
      const schema = await this.loadConfigSchema();

      const validate = this.ajv.compile(schema);
      const isValid = validate(config);

      const errors: ValidationError[] = [];

      if (!isValid) {
        validate.errors?.forEach(error => {
          errors.push({
            type: 'error',
            field: error.instancePath || error.params?.missingProperty,
            message: error.message || 'Schema 验证失败',
            severity: 'medium',
            suggestion: `检查字段 ${error.instancePath} 的格式`
          });
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: [],
        suggestions: [],
        score: errors.length === 0 ? 100 : 50,
        summary: `Schema 验证: ${errors.length} 个错误`
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'error',
          message: `Schema 验证失败: ${error.message}`,
          severity: 'high'
        }],
        warnings: [],
        suggestions: [],
        score: 0,
        summary: 'Schema 文件无法加载'
      };
    }
  }

  /**
   * 安全配置检查
   */
  private async checkSecuritySettings(config: any): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    // 检查API密钥
    if (config.apiKey && config.apiKey.length < 20) {
      warnings.push({
        type: 'warning',
        field: 'apiKey',
        message: 'API密钥长度过短，建议使用环境变量',
        severity: 'high',
        suggestion: '将API密钥移至环境变量，避免硬编码'
      });
    }

    // 检查敏感信息
    const content = JSON.stringify(config);
    if (content.includes('password') || content.includes('secret')) {
      warnings.push({
        type: 'warning',
        message: '配置文件可能包含敏感信息',
        severity: 'high',
        suggestion: '使用环境变量或安全的密钥管理服务'
      });
    }

    // 检查文件权限
    if (config.allowedPaths) {
      config.allowedPaths.forEach((path: string, index: number) => {
        if (path.includes('..') || path.startsWith('/etc') || path.startsWith('/root')) {
          warnings.push({
            type: 'warning',
            field: `allowedPaths[${index}]`,
            message: `路径 ${path} 可能存在安全风险`,
            severity: 'medium',
            suggestion: '限制文件访问路径，避免访问系统敏感目录'
          });
        }
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      suggestions: [],
      score: warnings.length === 0 ? 100 : Math.max(50, 100 - warnings.length * 10),
      summary: `安全检查: ${warnings.length} 个警告`
    };
  }

  /**
   * 最佳实践检查
   */
  private async checkBestPractices(config: any): Promise<ValidationResult> {
    const suggestions: ValidationSuggestion[] = [];

    // 检查版本号格式
    if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) {
      suggestions.push({
        type: 'suggestion',
        field: 'version',
        message: '建议使用语义化版本号格式 (x.y.z)',
        impact: 'low',
        action: '更新版本号格式，如 1.0.0'
      });
    }

    // 检查温度设置
    if (config.ai?.temperature !== undefined) {
      const temp = config.ai.temperature;
      if (temp > 0.8) {
        suggestions.push({
          type: 'suggestion',
          field: 'ai.temperature',
          message: '温度设置较高，可能导致输出不稳定',
          impact: 'medium',
          action: '考虑降低温度到 0.3-0.7 范围'
        });
      } else if (temp < 0.1) {
          suggestions.push({
            type: 'suggestion',
            field: 'ai.temperature',
            message: '温度设置过低，可能导致输出缺乏创造性',
            impact: 'low',
            action: '考虑提高温度到 0.3-0.7 范围'
          });
        }
    }

    // 检查最大token数
    if (config.ai?.maxTokens && config.ai.maxTokens > 4000) {
      suggestions.push({
        type: 'suggestion',
        field: 'ai.maxTokens',
        message: '最大token数设置较高，可能增加成本',
        impact: 'medium',
        action: '考虑根据实际需要调整token限制'
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions,
      score: 100 - suggestions.length * 2,
      summary: `最佳实践检查: ${suggestions.length} 个建议`
    };
  }

  /**
   * 工具特定规则检查
   */
  private async checkToolSpecificRules(config: any): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    const provider = config.ai?.provider?.toLowerCase();

    switch (provider) {
      case 'gemini':
        if (!config.context?.fileFiltering?.respectGitIgnore) {
          suggestions.push({
            type: 'suggestion',
            field: 'context.fileFiltering.respectGitIgnore',
            message: '建议启用 .gitignore 过滤',
            impact: 'medium',
            action: '设置 respectGitIgnore: true'
          });
        }
        break;

      case 'claude':
        if (!config.preferences?.language) {
          suggestions.push({
            type: 'suggestion',
            field: 'preferences.language',
            message: '建议指定首选编程语言',
            impact: 'low',
            action: '添加 language: "typescript" 或其他语言'
          });
        }
        break;

      case 'openai':
        if (!config.capabilities?.codeReview) {
          suggestions.push({
            type: 'suggestion',
            field: 'capabilities.codeReview',
            message: '启用代码审查功能可提升代码质量',
            impact: 'medium',
            action: '设置 codeReview: true'
          });
        }
        break;
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      suggestions,
      score: warnings.length === 0 ? 100 : 80,
      summary: `工具特定检查: ${suggestions.length} 个建议`
    };
  }

  /**
   * 加载配置Schema
   */
  private async loadConfigSchema() {
    const schemaPath = path.join(process.cwd(), 'packages/templates/schemas/config.schema.json');

    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      return JSON.parse(schemaContent);
    } catch {
      // 返回基础Schema
      return {
        type: 'object',
        required: ['project', 'version', 'ai'],
        properties: {
          project: { type: 'string' },
          version: { type: 'string' },
          ai: {
            type: 'object',
            required: ['provider', 'model'],
            properties: {
              provider: { type: 'string' },
              model: { type: 'string' },
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              maxTokens: { type: 'number', minimum: 1, maximum: 10000 }
            }
          }
        }
      };
    }
  }

  /**
   * 获取嵌套对象值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 生成验证摘要
   */
  private generateValidationSummary(isValid: boolean, errorCount: number, warningCount: number, suggestionCount: number): string {
    if (isValid && warningCount === 0 && suggestionCount === 0) {
      return '✅ 配置验证通过，所有检查项均符合要求';
    }

    const parts = [];
    if (errorCount > 0) {
      parts.push(`${errorCount} 个错误`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} 个警告`);
    }
    if (suggestionCount > 0) {
      parts.push(`${suggestionCount} 个建议`);
    }

    return `配置验证完成: ${parts.join(', ')}`;
  }

  /**
   * 获取所有验证规则
   */
  getValidationRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * 添加自定义验证规则
   */
  addValidationRule(rule: ValidationRule) {
    this.rules.push(rule);
  }

  /**
   * 验证单个配置值
   */
  async validateConfigValue(field: string, value: any, config: any): Promise<ValidationResult> {
    // 简单的字段验证逻辑
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 必需字段检查
    const requiredFields = ['project', 'version', 'ai.provider', 'ai.model'];
    if (requiredFields.includes(field) && (!value || value === '')) {
      errors.push({
        type: 'error',
        field,
        message: `字段 ${field} 是必需的`,
        severity: 'high',
        suggestion: `请提供 ${field} 的有效值`
      });
    }

    // 类型检查
    if (field === 'ai.temperature' && typeof value === 'number') {
      if (value < 0 || value > 2) {
        errors.push({
          type: 'error',
          field,
          message: '温度值必须在 0-2 之间',
          severity: 'medium',
          suggestion: '设置温度值在 0.0-2.0 范围内'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
      score: errors.length === 0 ? 100 : 0,
      summary: `字段 ${field} 验证完成`
    };
  }
}