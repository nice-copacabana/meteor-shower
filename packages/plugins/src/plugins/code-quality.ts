import { Plugin, PluginContext } from '../plugin-manager.js';
import chalk from 'chalk';

/**
 * 代码质量检查插件
 * 在配置应用前进行代码质量检查
 */
const codeQualityPlugin: Plugin = {
  id: 'code-quality-checker',
  name: '代码质量检查器',
  version: '1.0.0',
  description: '自动检查代码质量，包括语法、格式和最佳实践',
  author: 'meteor-shower team',
  enabled: true,
  dependencies: [],
  hooks: [
    {
      name: 'config:apply',
      handler: async (context: PluginContext) => {
        console.log(chalk.blue('🔍 执行代码质量检查...'));
        
        // 模拟代码质量检查
        const issues = await checkCodeQuality(context.data);
        
        if (issues.length > 0) {
          console.log(chalk.yellow(`⚠️  发现 ${issues.length} 个代码质量问题:`));
          issues.forEach(issue => {
            console.log(chalk.yellow(`   - ${issue}`));
          });
        } else {
          console.log(chalk.green('✅ 代码质量检查通过'));
        }
        
        return {
          ...context.data,
          codeQuality: {
            passed: issues.length === 0,
            issues: issues
          }
        };
      }
    },
    {
      name: 'template:load',
      handler: async (context: PluginContext) => {
        console.log(chalk.blue('📋 添加代码质量模板检查...'));
        
        // 为模板添加代码质量检查配置
        return {
          ...context.data,
          qualityChecks: {
            enableESLint: true,
            enablePrettier: true,
            enableTypeCheck: true
          }
        };
      }
    }
  ]
};

async function checkCodeQuality(data: any): Promise<string[]> {
  const issues: string[] = [];
  
  // 模拟各种代码质量检查
  if (!data.projectName || data.projectName.length < 3) {
    issues.push('项目名称应至少包含3个字符');
  }
  
  if (data.projectName && !/^[a-z][a-z0-9-]*$/.test(data.projectName)) {
    issues.push('项目名称应使用小写字母、数字和连字符');
  }
  
  if (!data.persona || data.persona.length < 10) {
    issues.push('AI角色描述应至少包含10个字符以提供足够的上下文');
  }
  
  // 检查配置完整性
  if (data.tools && data.tools.length === 0) {
    issues.push('至少应选择一个AI工具');
  }
  
  return issues;
}

export default codeQualityPlugin;