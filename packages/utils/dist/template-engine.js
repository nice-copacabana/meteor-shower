import Ajv from 'ajv';
import fs from 'fs/promises';
import path from 'path';
export class TemplateEngine {
    constructor() {
        this.ajv = new Ajv();
        this.loadSchema();
    }
    async loadSchema() {
        const schemaPath = path.join(process.cwd(), 'packages/templates/schemas/template.schema.json');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        this.schema = JSON.parse(schemaContent);
    }
    async loadTemplate(templateId) {
        const templatePath = path.join(process.cwd(), `packages/templates/samples/${templateId}.json`);
        const content = await fs.readFile(templatePath, 'utf-8');
        const template = JSON.parse(content);
        // 验证模板格式
        const validate = this.ajv.compile(this.schema);
        if (!validate(template)) {
            throw new Error(`模板格式无效: ${JSON.stringify(validate.errors)}`);
        }
        return template;
    }
    async renderTemplate(template, variables) {
        // 简单的模板渲染（后续可扩展为 Handlebars）
        let content = JSON.stringify(template, null, 2);
        // 替换变量占位符
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), String(value));
        }
        return content;
    }
    async listTemplates() {
        const samplesDir = path.join(process.cwd(), 'packages/templates/samples');
        const files = await fs.readdir(samplesDir);
        const templates = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const templateId = path.basename(file, '.json');
                    const template = await this.loadTemplate(templateId);
                    templates.push(template);
                }
                catch (error) {
                    console.warn(`跳过无效模板 ${file}:`, error);
                }
            }
        }
        return templates;
    }
}
