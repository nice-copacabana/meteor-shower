import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface ConfigFile {
  file: string;
  found: boolean;
  content?: string;
  target?: string;
}

export async function shareCommand() {
  console.log(chalk.cyan('📦 打包当前配置为模板...'));

  try {
    // 扫描当前项目配置
    const configs = await scanProjectConfigs();

    console.log(chalk.yellow('\n📋 发现的配置:'));
    configs.forEach(config => {
      const icon = config.found ? '✅' : '❌';
      const color = config.found ? 'green' : 'red';
      const target = config.target ? ` (${config.target})` : '';
      console.log(chalk[color](`  ${icon} ${config.file}${target}`));
    });

    if (configs.filter(c => c.found).length === 0) {
      console.log(chalk.yellow('⚠️  未发现任何AI配置文件'));
      return;
    }

    // 收集模板信息
    const templateInfo = await collectTemplateInfo();

    // 打包模板
    await createTemplatePackage(configs, templateInfo);

  } catch (error) {
    console.error(chalk.red('❌ 模板打包失败:'), error);
    process.exit(1);
  }
}

/**
 * 扫描项目中的AI配置文件
 */
async function scanProjectConfigs(): Promise<ConfigFile[]> {
  console.log(chalk.gray('🔍 扫描项目配置文件...'));

  const configPatterns = [
    { file: '~/.gemini/GEMINI.md', target: 'gemini' },
    { file: '~/.gemini/settings.json', target: 'gemini' },
    { file: '.gemini/commands/plan.toml', target: 'gemini' },
    { file: '~/.claude/claude_desktop_config.json', target: 'claude' },
    { file: './.cursorrules', target: 'cursor' },
    { file: './.openai/config.json', target: 'openai' }
  ];

  const foundConfigs: ConfigFile[] = [];

  for (const pattern of configPatterns) {
    const expandedPath = expandPath(pattern.file);
    const exists = await fileExists(expandedPath);

    if (exists) {
      try {
        const content = await fs.readFile(expandedPath, 'utf-8');
        foundConfigs.push({
          file: pattern.file,
          found: true,
          content,
          target: pattern.target
        });
      } catch (error) {
        foundConfigs.push({
          file: pattern.file,
          found: true,
          target: pattern.target
        });
      }
    } else {
      foundConfigs.push({
        file: pattern.file,
        found: false,
        target: pattern.target
      });
    }
  }

  return foundConfigs;
}

/**
 * 收集模板信息
 */
async function collectTemplateInfo() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'templateName',
      message: '模板名称 (用于标识模板):',
      default: 'my-ai-config',
      validate: (input) => input.length > 0 && /^[a-zA-Z0-9-_]+$/.test(input)
    },
    {
      type: 'input',
      name: 'displayName',
      message: '模板显示名称:',
      default: '我的AI工具配置'
    },
    {
      type: 'input',
      name: 'description',
      message: '模板描述:',
      default: '分享的AI工具配置文件模板'
    },
    {
      type: 'input',
      name: 'version',
      message: '模板版本:',
      default: '1.0.0'
    },
    {
      type: 'input',
      name: 'author',
      message: '作者名称:',
      default: os.userInfo().username
    }
  ]);

  return answers;
}

/**
 * 创建模板包
 */
async function createTemplatePackage(configs: ConfigFile[], templateInfo: any) {
  const timestamp = new Date().toISOString().split('T')[0];

  // 创建模板目录
  const templatesDir = path.join(process.cwd(), 'packages/templates/samples');
  const templateFileName = `${templateInfo.templateName}-${timestamp}.json`;
  const templatePath = path.join(templatesDir, templateFileName);

  // 构建模板内容
  const template = {
    id: templateInfo.templateName,
    name: templateInfo.displayName,
    version: templateInfo.version,
    description: templateInfo.description,
    author: templateInfo.author,
    created: new Date().toISOString(),
    targets: [...new Set(configs.filter(c => c.found).map(c => c.target).filter(Boolean))],
    variables: {
      projectName: "{{PROJECT_NAME}}",
      persona: "{{AI_PERSONA}}",
      author: templateInfo.author
    },
    files: configs.filter(c => c.found).map(config => ({
      path: config.file,
      target: config.target,
      content: config.content || '',
      description: `Configuration file for ${config.target}`
    }))
  };

  // 确保目录存在
  await fs.mkdir(templatesDir, { recursive: true });

  // 写入模板文件
  await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

  console.log(chalk.green('\n🎉 模板打包完成！'));
  console.log(chalk.gray(`📁 模板文件: ${templatePath}`));
  console.log(chalk.gray(`📋 模板ID: ${templateInfo.templateName}`));
  console.log(chalk.gray(`📦 包含文件: ${template.files.length} 个`));
  console.log(chalk.gray(`🎯 支持工具: ${template.targets.join(', ')}`));

  // 提供使用说明
  console.log(chalk.yellow('\n💡 使用方法:'));
  console.log(chalk.gray(`   1. 分享到 Cloud Hub: ms share upload`));
  console.log(chalk.gray(`   2. 应用此模板: ms init --template ${templateInfo.templateName}`));
  console.log(chalk.gray(`   3. 查看模板详情: ms template info ${templateInfo.templateName}`));
}

/**
 * 展开路径占位符
 */
function expandPath(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * 检查文件是否存在
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
