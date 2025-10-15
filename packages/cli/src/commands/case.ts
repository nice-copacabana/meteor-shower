/**
 * Case命令 - 能力验证案例管理
 * 
 * 提供案例的CRUD操作、搜索、导入导出等功能
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import * as fs from 'fs-extra';
import * as path from 'path';
import { 
  CaseManager, 
  CategoryManager,
  CaseCategory, 
  DifficultyLevel,
  ValidationCase,
  CATEGORY_METADATA,
  DIFFICULTY_METADATA
} from '@meteor-shower/capability-validation';

// 默认数据库路径
const DEFAULT_DB_PATH = path.join(process.cwd(), '.meteor-shower', 'cases.db');

/**
 * 获取CaseManager实例
 */
function getCaseManager(): CaseManager {
  fs.ensureDirSync(path.dirname(DEFAULT_DB_PATH));
  return new CaseManager(DEFAULT_DB_PATH);
}

/**
 * case命令主入口
 */
export function createCaseCommand(): Command {
  const caseCmd = new Command('case')
    .description('能力验证案例管理');

  // case create - 创建案例
  caseCmd
    .command('create')
    .description('创建新的验证案例')
    .option('-i, --interactive', '交互式创建', true)
    .option('-f, --file <path>', '从文件导入案例')
    .action(async (options) => {
      try {
        if (options.file) {
          await importCaseFromFile(options.file);
        } else {
          await createCaseInteractive();
        }
      } catch (error: any) {
        console.error(chalk.red('✗ 创建失败:'), error.message);
        process.exit(1);
      }
    });

  // case list - 列出案例
  caseCmd
    .command('list')
    .description('列出所有案例')
    .option('-c, --category <category>', '按类别筛选')
    .option('-d, --difficulty <difficulty>', '按难度筛选')
    .option('-t, --tag <tag>', '按标签筛选')
    .option('--certified', '只显示认证案例')
    .option('--limit <number>', '限制结果数量', '20')
    .action(async (options) => {
      try {
        await listCases(options);
      } catch (error: any) {
        console.error(chalk.red('✗ 查询失败:'), error.message);
        process.exit(1);
      }
    });

  // case show - 显示案例详情
  caseCmd
    .command('show <caseId>')
    .description('显示案例详细信息')
    .option('-v, --versions', '显示版本历史')
    .action(async (caseId, options) => {
      try {
        await showCase(caseId, options);
      } catch (error: any) {
        console.error(chalk.red('✗ 查询失败:'), error.message);
        process.exit(1);
      }
    });

  // case search - 搜索案例
  caseCmd
    .command('search <query>')
    .description('搜索案例')
    .option('-l, --limit <number>', '限制结果数量', '10')
    .action(async (query, options) => {
      try {
        await searchCases(query, options);
      } catch (error: any) {
        console.error(chalk.red('✗ 搜索失败:'), error.message);
        process.exit(1);
      }
    });

  // case edit - 编辑案例
  caseCmd
    .command('edit <caseId>')
    .description('编辑案例')
    .action(async (caseId) => {
      try {
        await editCase(caseId);
      } catch (error: any) {
        console.error(chalk.red('✗ 编辑失败:'), error.message);
        process.exit(1);
      }
    });

  // case delete - 删除案例
  caseCmd
    .command('delete <caseId>')
    .description('删除案例')
    .option('-y, --yes', '跳过确认')
    .action(async (caseId, options) => {
      try {
        await deleteCase(caseId, options);
      } catch (error: any) {
        console.error(chalk.red('✗ 删除失败:'), error.message);
        process.exit(1);
      }
    });

  // case export - 导出案例
  caseCmd
    .command('export <caseId>')
    .description('导出案例到文件')
    .option('-o, --output <path>', '输出文件路径')
    .action(async (caseId, options) => {
      try {
        await exportCase(caseId, options);
      } catch (error: any) {
        console.error(chalk.red('✗ 导出失败:'), error.message);
        process.exit(1);
      }
    });

  // case import - 导入案例
  caseCmd
    .command('import <file>')
    .description('从文件导入案例')
    .action(async (file) => {
      try {
        await importCaseFromFile(file);
      } catch (error: any) {
        console.error(chalk.red('✗ 导入失败:'), error.message);
        process.exit(1);
      }
    });

  // case stats - 统计信息
  caseCmd
    .command('stats')
    .description('显示案例库统计信息')
    .option('-c, --category <category>', '指定类别')
    .action(async (options) => {
      try {
        await showStats(options);
      } catch (error: any) {
        console.error(chalk.red('✗ 统计失败:'), error.message);
        process.exit(1);
      }
    });

  return caseCmd;
}

/**
 * 交互式创建案例
 */
async function createCaseInteractive(): Promise<void> {
  console.log(chalk.cyan.bold('\n📝 创建新的能力验证案例\n'));

  // 1. 选择类别
  const categoryChoices = Object.values(CaseCategory).map(cat => {
    const meta = CATEGORY_METADATA[cat];
    return {
      name: `${meta.icon} ${meta.name} - ${meta.description}`,
      value: cat
    };
  });

  const { category } = await inquirer.prompt([{
    type: 'list',
    name: 'category',
    message: '选择能力类别:',
    choices: categoryChoices
  }]);

  // 2. 选择难度
  const difficultyChoices = Object.values(DifficultyLevel).map(level => {
    const meta = DIFFICULTY_METADATA[level];
    return {
      name: `${meta.name} - ${meta.description} (${meta.estimatedTime})`,
      value: level
    };
  });

  const { difficulty } = await inquirer.prompt([{
    type: 'list',
    name: 'difficulty',
    message: '选择难度等级:',
    choices: difficultyChoices
  }]);

  // 3. 输入基本信息
  const basic = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: '案例标题:',
      validate: (input) => input.trim().length > 0 || '标题不能为空'
    },
    {
      type: 'input',
      name: 'description',
      message: '案例描述:',
      validate: (input) => input.trim().length > 0 || '描述不能为空'
    },
    {
      type: 'input',
      name: 'tags',
      message: '标签(用逗号分隔):',
      filter: (input) => input.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    }
  ]);

  // 4. 定义场景
  console.log(chalk.cyan('\n📋 定义测试场景:'));
  const scenario = await inquirer.prompt([
    {
      type: 'editor',
      name: 'context',
      message: '背景描述(将打开编辑器):',
      default: '请描述测试场景的背景...'
    },
    {
      type: 'editor',
      name: 'task',
      message: '具体任务(将打开编辑器):',
      default: '请描述需要完成的具体任务...'
    },
    {
      type: 'editor',
      name: 'input',
      message: '输入内容(将打开编辑器):',
      default: '请提供测试输入...'
    },
    {
      type: 'input',
      name: 'constraints',
      message: '约束条件(用逗号分隔,可选):',
      filter: (input) => input ? input.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : []
    }
  ]);

  // 5. 设置期望结果
  console.log(chalk.cyan('\n🎯 设置期望结果:'));
  const { expectedType } = await inquirer.prompt([{
    type: 'list',
    name: 'expectedType',
    message: '期望结果类型:',
    choices: [
      { name: '精确匹配 - 输出必须完全匹配', value: 'exact' },
      { name: '模式匹配 - 使用正则表达式验证', value: 'pattern' },
      { name: '评判标准 - 基于多个标准评估', value: 'criteria' },
      { name: '创意输出 - 主观评价', value: 'creative' }
    ]
  }]);

  let expected: any = { type: expectedType };

  if (expectedType === 'exact') {
    const { content } = await inquirer.prompt([{
      type: 'editor',
      name: 'content',
      message: '期望的精确输出(将打开编辑器):'
    }]);
    expected.content = content;
  } else if (expectedType === 'pattern') {
    const { pattern } = await inquirer.prompt([{
      type: 'input',
      name: 'pattern',
      message: '正则表达式模式:',
      validate: (input) => {
        try {
          new RegExp(input);
          return true;
        } catch {
          return '无效的正则表达式';
        }
      }
    }]);
    expected.pattern = pattern;
  } else if (expectedType === 'criteria') {
    const { criteria } = await inquirer.prompt([{
      type: 'input',
      name: 'criteria',
      message: '评判标准(用逗号分隔):',
      filter: (input) => input.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    }]);
    expected.criteria = criteria;
  }

  // 6. 配置评分标准
  console.log(chalk.cyan('\n⚖️ 配置评分权重 (总和应为100):'));
  const scoring = await inquirer.prompt([
    {
      type: 'number',
      name: 'accuracy',
      message: '准确性权重 (0-100):',
      default: 25,
      validate: (input) => input >= 0 && input <= 100 || '必须在0-100之间'
    },
    {
      type: 'number',
      name: 'completeness',
      message: '完整性权重 (0-100):',
      default: 25,
      validate: (input) => input >= 0 && input <= 100 || '必须在0-100之间'
    },
    {
      type: 'number',
      name: 'creativity',
      message: '创新性权重 (0-100):',
      default: 25,
      validate: (input) => input >= 0 && input <= 100 || '必须在0-100之间'
    },
    {
      type: 'number',
      name: 'efficiency',
      message: '效率权重 (0-100):',
      default: 25,
      validate: (input) => input >= 0 && input <= 100 || '必须在0-100之间'
    }
  ]);

  // 7. 作者信息
  const author = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '作者名称:',
      default: 'Anonymous'
    },
    {
      type: 'input',
      name: 'expertise',
      message: '专业领域(可选):'
    }
  ]);

  // 8. 元数据
  const { isPublic, isCertified } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'isPublic',
      message: '是否公开?',
      default: true
    },
    {
      type: 'confirm',
      name: 'isCertified',
      message: '标记为认证案例?',
      default: false
    }
  ]);

  // 9. 预览并确认
  console.log(chalk.cyan.bold('\n📦 案例预览:\n'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.white.bold('标题:'), basic.title);
  console.log(chalk.white.bold('类别:'), CATEGORY_METADATA[category].name);
  console.log(chalk.white.bold('难度:'), DIFFICULTY_METADATA[difficulty].name);
  console.log(chalk.white.bold('标签:'), basic.tags.join(', '));
  console.log(chalk.gray('─'.repeat(60)));

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: '确认创建?',
    default: true
  }]);

  if (!confirm) {
    console.log(chalk.yellow('✗ 已取消'));
    return;
  }

  // 10. 创建案例
  const spinner = ora('正在创建案例...').start();

  try {
    const manager = getCaseManager();
    const validationCase = await manager.createCase({
      title: basic.title,
      description: basic.description,
      category,
      difficulty,
      tags: basic.tags,
      scenario: {
        context: scenario.context,
        task: scenario.task,
        input: scenario.input,
        constraints: scenario.constraints
      },
      expected,
      scoring,
      author: {
        name: author.name,
        expertise: author.expertise || undefined
      },
      version: '1.0.0',
      isPublic,
      isCertified
    });

    manager.close();

    spinner.succeed(chalk.green(`✓ 案例创建成功!`));
    console.log(chalk.gray(`  案例ID: ${validationCase.id}`));
  } catch (error: any) {
    spinner.fail(chalk.red('创建失败'));
    throw error;
  }
}

/**
 * 列出案例
 */
async function listCases(options: any): Promise<void> {
  const spinner = ora('加载案例列表...').start();

  try {
    const manager = getCaseManager();
    
    const filter: any = {
      pageSize: parseInt(options.limit)
    };

    if (options.category) {
      filter.category = options.category as CaseCategory;
    }

    if (options.difficulty) {
      filter.difficulty = options.difficulty as DifficultyLevel;
    }

    if (options.tag) {
      filter.tags = [options.tag];
    }

    if (options.certified) {
      filter.isCertified = true;
    }

    const cases = await manager.getCases(filter);
    manager.close();

    spinner.succeed(chalk.green(`找到 ${cases.length} 个案例`));

    if (cases.length === 0) {
      console.log(chalk.yellow('\n暂无案例'));
      return;
    }

    // 显示表格
    const table = new Table({
      head: ['ID', '标题', '类别', '难度', '作者', '通过率'].map(h => chalk.cyan(h)),
      colWidths: [15, 30, 15, 12, 15, 10]
    });

    cases.forEach(c => {
      const categoryMeta = CATEGORY_METADATA[c.category];
      const difficultyMeta = DIFFICULTY_METADATA[c.difficulty];
      
      table.push([
        c.id.substring(0, 12) + '...',
        c.title.length > 27 ? c.title.substring(0, 27) + '...' : c.title,
        `${categoryMeta.icon} ${categoryMeta.name}`,
        difficultyMeta.name,
        c.author.name,
        `${(c.stats.passRate || 0).toFixed(1)}%`
      ]);
    });

    console.log('\n' + table.toString());
  } catch (error: any) {
    spinner.fail(chalk.red('加载失败'));
    throw error;
  }
}

/**
 * 显示案例详情
 */
async function showCase(caseId: string, options: any): Promise<void> {
  const spinner = ora('加载案例详情...').start();

  try {
    const manager = getCaseManager();
    const validationCase = await manager.getCaseById(caseId);

    if (!validationCase) {
      spinner.fail(chalk.red('案例不存在'));
      manager.close();
      return;
    }

    spinner.succeed(chalk.green('加载成功'));

    // 显示详细信息
    console.log(chalk.cyan.bold('\n📄 案例详情\n'));
    console.log(chalk.gray('═'.repeat(60)));
    
    console.log(chalk.white.bold('ID:'), validationCase.id);
    console.log(chalk.white.bold('标题:'), validationCase.title);
    console.log(chalk.white.bold('描述:'), validationCase.description);
    console.log(chalk.white.bold('类别:'), `${CATEGORY_METADATA[validationCase.category].icon} ${CATEGORY_METADATA[validationCase.category].name}`);
    console.log(chalk.white.bold('难度:'), DIFFICULTY_METADATA[validationCase.difficulty].name);
    console.log(chalk.white.bold('标签:'), validationCase.tags.join(', '));
    
    console.log(chalk.gray('\n─ 场景 ─'));
    console.log(chalk.white('背景:'), validationCase.scenario.context.substring(0, 100) + '...');
    console.log(chalk.white('任务:'), validationCase.scenario.task.substring(0, 100) + '...');
    
    console.log(chalk.gray('\n─ 统计 ─'));
    console.log(chalk.white('提交次数:'), validationCase.stats.submissions);
    console.log(chalk.white('平均得分:'), validationCase.stats.averageScore.toFixed(2));
    console.log(chalk.white('通过率:'), `${validationCase.stats.passRate.toFixed(1)}%`);
    
    console.log(chalk.gray('\n─ 元数据 ─'));
    console.log(chalk.white('作者:'), validationCase.author.name);
    console.log(chalk.white('版本:'), validationCase.version);
    console.log(chalk.white('公开:'), validationCase.isPublic ? '是' : '否');
    console.log(chalk.white('认证:'), validationCase.isCertified ? '是' : '否');
    console.log(chalk.white('创建时间:'), validationCase.createdAt.toLocaleString());
    console.log(chalk.gray('═'.repeat(60)));

    // 显示版本历史
    if (options.versions) {
      const versions = await manager.getCaseVersions(caseId);
      if (versions.length > 0) {
        console.log(chalk.cyan.bold('\n📚 版本历史\n'));
        versions.forEach(v => {
          console.log(`  ${chalk.yellow(v.version)} - ${v.changes} (${v.createdAt.toLocaleString()})`);
        });
      }
    }

    manager.close();
  } catch (error: any) {
    spinner.fail(chalk.red('加载失败'));
    throw error;
  }
}

/**
 * 搜索案例
 */
async function searchCases(query: string, options: any): Promise<void> {
  const spinner = ora(`搜索 "${query}"...`).start();

  try {
    const manager = getCaseManager();
    const cases = await manager.searchCases({
      query,
      limit: parseInt(options.limit)
    });
    manager.close();

    spinner.succeed(chalk.green(`找到 ${cases.length} 个匹配结果`));

    if (cases.length === 0) {
      console.log(chalk.yellow('\n未找到匹配的案例'));
      return;
    }

    // 显示结果
    cases.forEach((c, index) => {
      console.log(`\n${chalk.cyan(`${index + 1}.`)} ${chalk.white.bold(c.title)}`);
      console.log(`   ${chalk.gray(c.id)}`);
      console.log(`   ${CATEGORY_METADATA[c.category].icon} ${CATEGORY_METADATA[c.category].name} | ${DIFFICULTY_METADATA[c.difficulty].name}`);
      console.log(`   ${chalk.gray(c.description.substring(0, 80) + '...')}`);
    });
  } catch (error: any) {
    spinner.fail(chalk.red('搜索失败'));
    throw error;
  }
}

/**
 * 编辑案例
 */
async function editCase(caseId: string): Promise<void> {
  console.log(chalk.yellow('\n⚠️ 编辑功能开发中...'));
  console.log(chalk.gray('提示: 可以使用 export 导出案例,修改后再 import 导入'));
}

/**
 * 删除案例
 */
async function deleteCase(caseId: string, options: any): Promise<void> {
  const manager = getCaseManager();
  const validationCase = await manager.getCaseById(caseId);

  if (!validationCase) {
    console.log(chalk.red('✗ 案例不存在'));
    manager.close();
    return;
  }

  if (!options.yes) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `确认删除案例 "${validationCase.title}"?`,
      default: false
    }]);

    if (!confirm) {
      console.log(chalk.yellow('✗ 已取消'));
      manager.close();
      return;
    }
  }

  const spinner = ora('正在删除...').start();

  try {
    await manager.deleteCase(caseId);
    manager.close();
    spinner.succeed(chalk.green('✓ 删除成功'));
  } catch (error: any) {
    spinner.fail(chalk.red('删除失败'));
    manager.close();
    throw error;
  }
}

/**
 * 导出案例
 */
async function exportCase(caseId: string, options: any): Promise<void> {
  const spinner = ora('正在导出...').start();

  try {
    const manager = getCaseManager();
    const validationCase = await manager.getCaseById(caseId);

    if (!validationCase) {
      spinner.fail(chalk.red('案例不存在'));
      manager.close();
      return;
    }

    const outputPath = options.output || `${caseId}.json`;
    await fs.writeJSON(outputPath, validationCase, { spaces: 2 });
    
    manager.close();
    spinner.succeed(chalk.green(`✓ 已导出到 ${outputPath}`));
  } catch (error: any) {
    spinner.fail(chalk.red('导出失败'));
    throw error;
  }
}

/**
 * 从文件导入案例
 */
async function importCaseFromFile(filePath: string): Promise<void> {
  const spinner = ora('正在导入...').start();

  try {
    const caseData = await fs.readJSON(filePath);
    const manager = getCaseManager();
    
    // 移除只读字段
    delete caseData.id;
    delete caseData.createdAt;
    delete caseData.updatedAt;
    delete caseData.stats;

    const validationCase = await manager.createCase(caseData);
    manager.close();

    spinner.succeed(chalk.green(`✓ 导入成功 (ID: ${validationCase.id})`));
  } catch (error: any) {
    spinner.fail(chalk.red('导入失败'));
    throw error;
  }
}

/**
 * 显示统计信息
 */
async function showStats(options: any): Promise<void> {
  const spinner = ora('正在加载统计信息...').start();

  try {
    const manager = getCaseManager();
    const overview = manager.categoryManager.getGlobalOverview();

    spinner.succeed(chalk.green('加载成功'));

    console.log(chalk.cyan.bold('\n📊 案例库统计\n'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.white.bold('总案例数:'), overview.totalCases);
    console.log(chalk.white.bold('平均得分:'), overview.averageScore.toFixed(2));
    console.log(chalk.white.bold('平均通过率:'), `${overview.passRate.toFixed(1)}%`);

    console.log(chalk.cyan.bold('\n📋 类别分布\n'));
    const categoryTable = new Table({
      head: ['类别', '案例数', '占比'].map(h => chalk.cyan(h))
    });

    Object.entries(overview.categoryDistribution).forEach(([cat, count]) => {
      const percentage = overview.totalCases > 0 ? ((count / overview.totalCases) * 100).toFixed(1) : '0';
      const meta = CATEGORY_METADATA[cat as CaseCategory];
      categoryTable.push([
        `${meta.icon} ${meta.name}`,
        count.toString(),
        `${percentage}%`
      ]);
    });

    console.log(categoryTable.toString());

    console.log(chalk.cyan.bold('\n⚡ 难度分布\n'));
    const difficultyTable = new Table({
      head: ['难度', '案例数', '占比'].map(h => chalk.cyan(h))
    });

    Object.entries(overview.difficultyDistribution).forEach(([level, count]) => {
      const percentage = overview.totalCases > 0 ? ((count / overview.totalCases) * 100).toFixed(1) : '0';
      const meta = DIFFICULTY_METADATA[level as DifficultyLevel];
      difficultyTable.push([
        meta.name,
        count.toString(),
        `${percentage}%`
      ]);
    });

    console.log(difficultyTable.toString());

    manager.close();
  } catch (error: any) {
    spinner.fail(chalk.red('加载失败'));
    throw error;
  }
}
