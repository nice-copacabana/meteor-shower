/**
 * 模板引擎模块
 * 负责模板加载、验证、渲染和变量替换
 *
 * 核心功能：
 * - JSON Schema验证：确保模板格式正确
 * - 变量替换：支持模板变量动态替换
 * - 模板管理：加载和管理模板文件
 */

import Ajv from 'ajv';                      // JSON Schema验证器
import fs from 'fs/promises';               // 文件系统操作（Promise API）
import path from 'path';                    // 路径操作

/**
 * 模板元数据接口
 * 定义模板的基本信息和配置
 */
export interface TemplateMetadata {
  id: string;                               // 模板唯一标识符
  name: string;                             // 模板显示名称
  version: string;                          // 模板版本
  targets: string[];                        // 支持的目标工具类型
  variables: Record<string, string>;        // 模板需要的变量定义
}

/**
 * 模板引擎类
 * 提供模板的完整生命周期管理
 */
export class TemplateEngine {
  private ajv: Ajv;                         // JSON Schema验证器实例
  private schema: any;                      // 模板Schema定义

  /**
   * 构造函数
   * 初始化AJV验证器并加载模板Schema
   */
  constructor() {
    this.ajv = new Ajv();                  // 创建AJV实例
    this.loadSchema();                     // 异步加载Schema（注意：这里是同步调用的）
  }

  /**
   * 加载模板Schema
   * 从文件系统读取并解析模板验证Schema
   *
   * 路径：packages/templates/schemas/template.schema.json
   */
  private async loadSchema() {
    const schemaPath = path.join(process.cwd(), 'packages/templates/schemas/template.schema.json');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);
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
   * 使用提供的变量替换模板中的占位符
   *
   * 占位符格式：{{variableName}}
   * 例如：{{projectName}} -> 实际项目名
   *
   * @param template 模板元数据
   * @param variables 变量映射对象
   * @returns 渲染后的模板内容（JSON字符串）
   */
  async renderTemplate(template: TemplateMetadata, variables: Record<string, unknown>): Promise<string> {
    // 简单的模板渲染（后续可扩展为 Handlebars）
    let content = JSON.stringify(template, null, 2);

    // 替换所有变量占位符
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return content;
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
