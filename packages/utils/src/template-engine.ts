/**
 * 模板引擎模块
 * 负责模板加载、验证、渲染和变量替换
 *
 * 核心功能：
 * - JSON Schema验证：确保模板格式正确
 * - 高级变量替换：支持模板变量动态替换和条件逻辑
 * - 模板管理：加载和管理模板文件
 * - 模板继承：支持模板继承和组合
 * - 预处理和后处理：支持模板预处理和后处理
 * - 性能优化：模板编译和缓存
 */

import Ajv from 'ajv';                      // JSON Schema验证器
import fs from 'fs/promises';               // 文件系统操作（Promise API）
import path from 'path';                    // 路径操作
import { logger, withErrorHandler, withPerformanceMonitor } from './error-handler.js'; // 错误处理

// 模板变量类型
export type TemplateVariable = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
};

// 模板内容块接口
export interface TemplateContentBlock {
  type: 'text' | 'variable' | 'condition' | 'loop' | 'include';
  content: string;
  variable?: string;
  condition?: string;
  loop?: {
    variable: string;
    template: string;
  };
  include?: string;
}

// 模板文件接口
export interface TemplateFile {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  executable?: boolean;
  template?: boolean;
}

// 增强的模板元数据接口
export interface TemplateMetadata {
  id: string;                               // 模板唯一标识符
  name: string;                             // 模板显示名称
  version: string;                          // 模板版本
  description?: string;                     // 模板描述
  author?: string;                          // 作者信息
  targets: string[];                        // 支持的目标工具类型
  variables: Record<string, TemplateVariable>; // 模板变量定义
  files: TemplateFile[];                    // 模板文件列表
  extends?: string;                         // 继承的父模板
  mixins?: string[];                        // 混入的模板
  preProcess?: string[];                    // 预处理步骤
  postProcess?: string[];                   // 后处理步骤
  metadata?: Record<string, any>;           // 额外元数据
  tags?: string[];                          // 标签分类
  rating?: number;                          // 评分
  downloadCount?: number;                   // 下载次数
}

// 渲染上下文接口
export interface RenderContext {
  variables: Record<string, any>;
  functions?: Record<string, Function>;
  filters?: Record<string, Function>;
  partials?: Record<string, string>;
  globals?: Record<string, any>;
}

// 渲染选项接口
export interface RenderOptions {
  context: RenderContext;
  escapeHtml?: boolean;
  allowExec?: boolean;
  maxDepth?: number;
  timeout?: number;
}

// 内置函数和过滤器
const BUILT_IN_FUNCTIONS: Record<string, Function> = {
  now: () => new Date().toISOString(),
  date: (format?: string) => {
    const date = new Date();
    if (format === 'short') return date.toLocaleDateString();
    if (format === 'time') return date.toLocaleTimeString();
    return date.toISOString();
  },
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  random: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  env: (key: string, defaultValue = '') => process.env[key] || defaultValue,
  base64: (str: string) => Buffer.from(str).toString('base64'),
  hash: (str: string) => require('crypto').createHash('sha256').update(str).digest('hex')
};

const BUILT_IN_FILTERS: Record<string, Function> = {
  uppercase: (str: string) => str.toUpperCase(),
  lowercase: (str: string) => str.toLowerCase(),
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  trim: (str: string) => str.trim(),
  length: (arr: any[]) => arr.length,
  first: (arr: any[]) => arr[0],
  last: (arr: any[]) => arr[arr.length - 1],
  join: (arr: any[], separator = ',') => arr.join(separator),
  split: (str: string, separator = ',') => str.split(separator),
  replace: (str: string, pattern: string, replacement: string) => str.replace(new RegExp(pattern, 'g'), replacement),
  truncate: (str: string, length = 50) => str.length > length ? str.substring(0, length) + '...' : str,
  format: (str: string, ...args: any[]) => str.replace(/{(\d+)}/g, (match, index) => args[index] || match)
};

/**
 * 增强的模板引擎类
 * 提供模板的完整生命周期管理和高级功能
 */
export class TemplateEngine {
  private ajv: Ajv;                         // JSON Schema验证器实例
  private schema: any;                      // 模板Schema定义
  private compiledTemplates = new Map<string, Function>(); // 编译的模板缓存
  private loadedTemplates = new Map<string, TemplateMetadata>(); // 已加载的模板
  private functionRegistry = new Map<string, Function>(); // 自定义函数注册表

  /**
   * 构造函数
   * 初始化AJV验证器并加载模板Schema
   */
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });

    // 注册内置函数
    Object.entries(BUILT_IN_FUNCTIONS).forEach(([name, func]) => {
      this.registerFunction(name, func);
    });

    this.loadSchema();
    logger.debug('TemplateEngine initialized');
  }

  /**
   * 注册自定义函数
   */
  registerFunction(name: string, func: Function) {
    this.functionRegistry.set(name, func);
    logger.debug('Template function registered', { name });
  }

  /**
   * 注册自定义过滤器
   */
  registerFilter(name: string, filter: Function) {
    // 过滤器作为函数处理
    this.registerFunction(name, filter);
  }

  /**
   * 加载模板Schema
   * 从文件系统读取并解析模板验证Schema
   *
   * 路径：packages/templates/schemas/template.schema.json
   */
  private async loadSchema() {
    try {
      const schemaPath = path.join(process.cwd(), 'packages/templates/schemas/template.schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      this.schema = JSON.parse(schemaContent);
      logger.debug('Template schema loaded', { schemaPath });
    } catch (error) {
      logger.warn('Failed to load template schema, using default', error);
      // 使用默认Schema
      this.schema = this.getDefaultSchema();
    }
  }

  /**
   * 获取默认Schema
   */
  private getDefaultSchema() {
    return {
      type: 'object',
      required: ['id', 'name', 'version', 'targets', 'variables', 'files'],
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9-_]+$' },
        name: { type: 'string', minLength: 1 },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
        description: { type: 'string' },
        author: { type: 'string' },
        targets: { type: 'array', items: { type: 'string' } },
        variables: { type: 'object' },
        files: { type: 'array', items: { type: 'object' } },
        extends: { type: 'string' },
        mixins: { type: 'array', items: { type: 'string' } },
        preProcess: { type: 'array', items: { type: 'string' } },
        postProcess: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    };
  }

  /**
   * 加载指定模板
   * 从文件系统读取模板文件并验证其格式
   *
   * @param templateId 模板ID
   * @returns 验证通过的模板元数据
   * @throws 当模板不存在或格式无效时抛出错误
   */
  async loadTemplate(templateId: string): Promise<TemplateMetadata> {
    const templatePath = path.join(process.cwd(), `packages/templates/samples/${templateId}.json`);
    const content = await fs.readFile(templatePath, 'utf-8');
    const template = JSON.parse(content) as TemplateMetadata;

    // 使用JSON Schema验证模板格式
    const validate = this.ajv.compile(this.schema);
    if (!validate(template)) {
      throw new Error(`模板格式无效: ${JSON.stringify(validate.errors)}`);
    }

    return template;
  }

  /**
   * 渲染模板
   * 使用提供的变量和上下文替换模板中的占位符
   *
   * 支持的语法：
   * - {{variable}} - 变量替换
   * - {{function()}} - 函数调用
   * - {{variable | filter}} - 过滤器应用
   * - {{#condition}}...{{/condition}} - 条件语句
   * - {{#each array}}...{{/each}} - 循环语句
   * - {{> partial}} - 包含片段
   *
   * @param template 模板元数据
   * @param variables 变量映射对象
   * @param options 渲染选项
   * @returns 渲染后的模板内容
   */
  @withErrorHandler
  @withPerformanceMonitor
  async renderTemplate(template: TemplateMetadata, variables: Record<string, unknown>, options: RenderOptions): Promise<string> {
    try {
      // 验证模板
      await this.validateTemplate(template);

      // 处理模板继承
      const processedTemplate = await this.processTemplateInheritance(template);

      // 执行预处理
      const preprocessedTemplate = await this.executePreProcess(processedTemplate, options);

      // 渲染文件内容
      const renderedFiles = await Promise.all(
        processedTemplate.files.map(file =>
          this.renderFile(file, options)
        )
      );

      // 执行后处理
      const finalFiles = await this.executePostProcess(renderedFiles, options);

      // 返回配置操作列表
      return this.generateConfigOperations(processedTemplate, finalFiles, options);

    } catch (error) {
      logger.error('Template rendering failed', error, { templateId: template.id });
      throw error;
    }
  }

  /**
   * 渲染单个文件
   */
  private async renderFile(file: TemplateFile, options: RenderOptions): Promise<TemplateFile> {
    if (!file.template) {
      return file; // 非模板文件直接返回
    }

    const renderedContent = await this.renderContent(file.content, options);
    return { ...file, content: renderedContent };
  }

  /**
   * 渲染内容
   */
  private async renderContent(content: string, options: RenderOptions): Promise<string> {
    let result = content;
    const context = options.context;

    // 变量替换
    result = await this.replaceVariables(result, context);

    // 函数调用
    result = await this.processFunctions(result, context);

    // 条件语句
    result = await this.processConditions(result, context);

    // 循环语句
    result = await this.processLoops(result, context);

    // 包含片段
    result = await this.processIncludes(result, context);

    return result;
  }

  /**
   * 替换变量
   */
  private async replaceVariables(content: string, context: RenderContext): Promise<string> {
    const variableRegex = /\{\{([^|}]+)\}\}/g;

    let result = content;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const variableExpression = match[1].trim();

      try {
        const value = await this.evaluateVariable(variableExpression, context);
        result = result.replace(new RegExp(this.escapeRegExp(fullMatch), 'g'), String(value));
      } catch (error) {
        logger.warn('Variable evaluation failed', error, { expression: variableExpression });
        // 保留原占位符
      }
    }

    return result;
  }

  /**
   * 评估变量表达式
   */
  private async evaluateVariable(expression: string, context: RenderContext): Promise<any> {
    const parts = expression.split('|').map(p => p.trim());
    let variableName = parts[0];
    const filters = parts.slice(1);

    // 获取变量值
    let value = context.variables[variableName];

    // 如果是函数调用
    if (variableName.includes('(') && variableName.endsWith(')')) {
      const funcMatch = variableName.match(/^(\w+)\((.*)\)$/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const args = funcMatch[2] ? funcMatch[2].split(',').map(arg => {
          const trimmed = arg.trim();
          // 尝试解析为数字或布尔值
          if (/^\d+$/.test(trimmed)) return parseInt(trimmed);
          if (/^true|false$/.test(trimmed)) return trimmed === 'true';
          if (/^["'].*["']$/.test(trimmed)) return trimmed.slice(1, -1);
          return trimmed;
        }) : [];

        const func = this.functionRegistry.get(funcName);
        if (func) {
          value = await func(...args);
        }
      }
    }

    // 应用过滤器
    for (const filterName of filters) {
      const filter = this.functionRegistry.get(filterName);
      if (filter) {
        value = await filter(value);
      }
    }

    return value;
  }

  /**
   * 处理函数调用
   */
  private async processFunctions(content: string, context: RenderContext): Promise<string> {
    // 函数调用已在变量替换中处理
    return content;
  }

  /**
   * 处理条件语句
   */
  private async processConditions(content: string, context: RenderContext): Promise<string> {
    const conditionRegex = /\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return content.replace(conditionRegex, (match, condition, content) => {
      try {
        const result = this.evaluateCondition(condition, context);
        return result ? content : '';
      } catch {
        return ''; // 条件评估失败时返回空
      }
    });
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: string, context: RenderContext): boolean {
    // 简单的条件评估
    const trimmed = condition.trim();

    // 变量存在性检查
    if (trimmed.startsWith('exists ')) {
      const varName = trimmed.substring(7);
      return context.variables[varName] !== undefined && context.variables[varName] !== null;
    }

    // 简单的真值检查
    const value = context.variables[trimmed];
    return Boolean(value);
  }

  /**
   * 处理循环语句
   */
  private async processLoops(content: string, context: RenderContext): Promise<string> {
    const loopRegex = /\{\{#each ([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return content.replace(loopRegex, (match, arrayName, template) => {
      const array = context.variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array.map((item, index) => {
        let result = template;
        // 替换循环变量
        result = result.replace(/\{\{this\}\}/g, String(item));
        result = result.replace(/\{\{index\}\}/g, String(index));
        return result;
      }).join('');
    });
  }

  /**
   * 处理包含片段
   */
  private async processIncludes(content: string, context: RenderContext): Promise<string> {
    const includeRegex = /\{\{> ([^}]+)\}\}/g;

    let result = content;
    const includes: string[] = [];

    // 收集所有包含
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      includes.push(match[1]);
    }

    // 处理包含
    for (const includeName of includes) {
      const partial = context.partials?.[includeName];
      if (partial) {
        // 递归渲染包含的内容
        const renderedPartial = await this.renderContent(partial, context);
        result = result.replace(new RegExp(`{{> ${this.escapeRegExp(includeName)}}}`, 'g'), renderedPartial);
      }
    }

    return result;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 验证模板
   */
  private async validateTemplate(template: TemplateMetadata): Promise<void> {
    const validate = this.ajv.compile(this.schema);
    if (!validate(template)) {
      const errors = validate.errors?.map(err =>
        `${err.instancePath} ${err.message}`
      ).join('; ') || 'Unknown error';

      throw new Error(`模板验证失败: ${errors}`);
    }

    // 验证变量
    await this.validateTemplateVariables(template);
  }

  /**
   * 验证模板变量
   */
  private async validateTemplateVariables(template: TemplateMetadata): Promise<void> {
    for (const [name, variable] of Object.entries(template.variables)) {
      if (variable.required && !variable.default && variable.type !== 'object') {
        // 必需变量应该有默认值
        logger.warn('Required variable without default value', { name, variable });
      }

      if (variable.validation?.pattern) {
        try {
          new RegExp(variable.validation.pattern);
        } catch {
          throw new Error(`无效的正则表达式模式: ${name} -> ${variable.validation.pattern}`);
        }
      }
    }
  }

  /**
   * 处理模板继承
   */
  private async processTemplateInheritance(template: TemplateMetadata): Promise<TemplateMetadata> {
    if (!template.extends) {
      return template;
    }

    const parentTemplate = await this.loadTemplate(template.extends);
    const mergedTemplate = this.mergeTemplates(parentTemplate, template);

    return mergedTemplate;
  }

  /**
   * 合并模板（继承）
   */
  private mergeTemplates(parent: TemplateMetadata, child: TemplateMetadata): TemplateMetadata {
    return {
      ...parent,
      ...child,
      variables: { ...parent.variables, ...child.variables },
      files: [...parent.files, ...child.files],
      targets: [...new Set([...parent.targets, ...child.targets])],
      tags: [...new Set([...(parent.tags || []), ...(child.tags || [])])]
    };
  }

  /**
   * 执行预处理
   */
  private async executePreProcess(template: TemplateMetadata, options: RenderOptions): Promise<TemplateMetadata> {
    if (!template.preProcess) {
      return template;
    }

    let processedTemplate = { ...template };

    for (const step of template.preProcess) {
      processedTemplate = await this.executePreProcessStep(processedTemplate, step, options);
    }

    return processedTemplate;
  }

  /**
   * 执行预处理步骤
   */
  private async executePreProcessStep(template: TemplateMetadata, step: string, options: RenderOptions): Promise<TemplateMetadata> {
    // 这里可以实现各种预处理逻辑
    // 例如：变量默认值设置、环境变量注入等

    switch (step) {
      case 'inject-env-vars':
        return this.injectEnvironmentVariables(template, options);
      case 'validate-variables':
        await this.validateTemplateVariables(template);
        return template;
      default:
        logger.debug('Unknown preprocess step', { step });
        return template;
    }
  }

  /**
   * 注入环境变量
   */
  private injectEnvironmentVariables(template: TemplateMetadata, options: RenderOptions): TemplateMetadata {
    const envVariables: Record<string, any> = {};

    // 从环境变量注入
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith('TEMPLATE_')) {
        const varName = key.substring(9).toLowerCase();
        envVariables[varName] = value;
      }
    });

    return {
      ...template,
      variables: {
        ...template.variables,
        ...envVariables
      }
    };
  }

  /**
   * 执行后处理
   */
  private async executePostProcess(files: TemplateFile[], options: RenderOptions): Promise<TemplateFile[]> {
    // 这里可以实现各种后处理逻辑
    // 例如：文件权限设置、内容优化等

    return files.map(file => ({
      ...file,
      content: this.postProcessContent(file.content, options)
    }));
  }

  /**
   * 后处理内容
   */
  private postProcessContent(content: string, options: RenderOptions): string {
    // 移除多余的空行
    return content.replace(/\n{3,}/g, '\n\n');
  }

  /**
   * 生成配置操作
   */
  private generateConfigOperations(template: TemplateMetadata, files: TemplateFile[], options: RenderOptions): string {
    const operations = files.map(file => ({
      target: this.determineTargetFromPath(file.path),
      path: file.path,
      content: file.content,
      kind: this.determineOperationKind(file),
      executable: file.executable
    }));

    return JSON.stringify({
      templateId: template.id,
      templateName: template.name,
      version: template.version,
      variables: options.context.variables,
      operations,
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'meteor-shower-template-engine'
      }
    }, null, 2);
  }

  /**
   * 从文件路径确定目标工具
   */
  private determineTargetFromPath(filePath: string): string {
    if (filePath.includes('gemini') || filePath.includes('GEMINI')) {
      return 'gemini';
    }
    if (filePath.includes('claude') || filePath.includes('CLAUDE')) {
      return 'claude';
    }
    if (filePath.includes('cursor') || filePath.includes('cursorrules')) {
      return 'cursor';
    }
    if (filePath.includes('openai') || filePath.includes('AGENTS')) {
      return 'openai';
    }
    return 'unknown';
  }

  /**
   * 确定操作类型
   */
  private determineOperationKind(file: TemplateFile): 'create' | 'update' | 'delete' {
    // 基于文件扩展名和内容决定操作类型
    if (file.path.endsWith('.bak') || file.path.includes('backup')) {
      return 'delete'; // 备份文件通常会被删除
    }
    return file.path.includes('update') ? 'update' : 'create';
  }

  /**
   * 加载指定模板
   * 从文件系统读取模板文件并验证其格式
   *
   * @param templateId 模板ID
   * @returns 模板元数据
   */
  async loadTemplate(templateId: string): Promise<TemplateMetadata> {
    // 检查缓存
    if (this.loadedTemplates.has(templateId)) {
      return this.loadedTemplates.get(templateId)!;
    }

    const templatePath = path.join(process.cwd(), `packages/templates/samples/${templateId}.json`);

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(content) as TemplateMetadata;

      // 验证模板
      await this.validateTemplate(template);

      // 缓存模板
      this.loadedTemplates.set(templateId, template);

      logger.info('Template loaded successfully', {
        templateId,
        templateName: template.name,
        version: template.version
      });

      return template;
    } catch (error) {
      logger.error('Failed to load template', error, { templateId });
      throw new Error(`模板加载失败: ${templateId} - ${error.message}`);
    }
  }

  /**
   * 列出所有可用模板
   * 扫描模板目录，加载并验证所有JSON模板文件
   *
   * @param filter 过滤条件（可选）
   * @returns 可用模板列表
   */
  async listTemplates(filter?: {
    targets?: string[];
    tags?: string[];
    author?: string;
  }): Promise<TemplateMetadata[]> {
    try {
      const templatesDir = path.join(process.cwd(), 'packages/templates/samples');
      const files = await fs.readdir(templatesDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const templates: TemplateMetadata[] = [];

      for (const file of jsonFiles) {
        try {
          const templateId = file.replace('.json', '');
          const template = await this.loadTemplate(templateId);

          // 应用过滤器
          if (this.matchesFilter(template, filter)) {
            templates.push(template);
          }
        } catch (error) {
          logger.warn('Failed to load template file', error, { file });
        }
      }

      // 按名称排序
      templates.sort((a, b) => a.name.localeCompare(b.name));

      logger.info('Templates listed', {
        total: templates.length,
        filter: filter || {}
      });

      return templates;
    } catch (error) {
      logger.error('Failed to list templates', error);
      throw error;
    }
  }

  /**
   * 检查模板是否匹配过滤条件
   */
  private matchesFilter(template: TemplateMetadata, filter?: {
    targets?: string[];
    tags?: string[];
    author?: string;
  }): boolean {
    if (!filter) return true;

    if (filter.targets && !filter.targets.some(target => template.targets.includes(target))) {
      return false;
    }

    if (filter.tags && !filter.tags.some(tag => template.tags?.includes(tag))) {
      return false;
    }

    if (filter.author && template.author !== filter.author) {
      return false;
    }

    return true;
  }

  /**
   * 编译模板
   * 将模板编译为可重用的函数
   *
   * @param template 模板元数据
   * @returns 编译后的渲染函数
   */
  async compileTemplate(template: TemplateMetadata): Promise<Function> {
    const cacheKey = `${template.id}-${template.version}`;

    // 检查缓存
    if (this.compiledTemplates.has(cacheKey)) {
      return this.compiledTemplates.get(cacheKey)!;
    }

    // 编译模板
    const compiledFunction = async (variables: Record<string, any>) => {
      const options: RenderOptions = {
        context: {
          variables,
          functions: Object.fromEntries(this.functionRegistry),
          filters: BUILT_IN_FILTERS,
          globals: {
            templateId: template.id,
            templateVersion: template.version,
            timestamp: new Date().toISOString()
          }
        }
      };

      return await this.renderTemplate(template, variables, options);
    };

    // 缓存编译结果
    this.compiledTemplates.set(cacheKey, compiledFunction);

    logger.debug('Template compiled', { templateId: template.id, cacheKey });

    return compiledFunction;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.compiledTemplates.clear();
    this.loadedTemplates.clear();
    logger.info('Template cache cleared');
  }

  /**
   * 获取模板统计信息
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    totalTargets: number;
    targetDistribution: Record<string, number>;
    authorDistribution: Record<string, number>;
    averageRating: number;
    totalDownloads: number;
  }> {
    try {
      const templates = await this.listTemplates();
      const targetDistribution: Record<string, number> = {};
      const authorDistribution: Record<string, number> = {};
      let totalRating = 0;
      let totalDownloads = 0;

      for (const template of templates) {
        // 统计目标工具分布
        for (const target of template.targets) {
          targetDistribution[target] = (targetDistribution[target] || 0) + 1;
        }

        // 统计作者分布
        if (template.author) {
          authorDistribution[template.author] = (authorDistribution[template.author] || 0) + 1;
        }

        // 累计评分和下载量
        totalRating += template.rating || 0;
        totalDownloads += template.downloadCount || 0;
      }

      return {
        totalTemplates: templates.length,
        totalTargets: Object.keys(targetDistribution).length,
        targetDistribution,
        authorDistribution,
        averageRating: templates.length > 0 ? totalRating / templates.length : 0,
        totalDownloads
      };
    } catch (error) {
      logger.error('Failed to get template stats', error);
      throw error;
    }
  }
}

  /**
   * 列出所有可用模板
   * 扫描模板目录，加载并验证所有JSON模板文件
   *
   * @returns 有效模板的数组
   */
  async listTemplates(): Promise<TemplateMetadata[]> {
    const samplesDir = path.join(process.cwd(), 'packages/templates/samples');
    const files = await fs.readdir(samplesDir);
    const templates: TemplateMetadata[] = [];

    // 遍历所有JSON文件，尝试加载为模板
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const templateId = path.basename(file, '.json');
          const template = await this.loadTemplate(templateId);
          templates.push(template);
        } catch (error) {
          // 跳过无效的模板文件，只输出警告
          console.warn(`跳过无效模板 ${file}:`, error);
        }
      }
    }

    return templates;
  }
}
