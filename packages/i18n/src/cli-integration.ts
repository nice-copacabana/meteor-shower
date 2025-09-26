import { I18nManager, SupportedLocale } from './index.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export class I18nCLI {
  private i18n: I18nManager;
  private initialized = false;

  constructor(options?: { defaultLocale?: SupportedLocale; autoDetect?: boolean }) {
    this.i18n = new I18nManager(options);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 自动检测语言
    const detectedLocale = this.i18n.detectLocale();
    this.i18n.setLocale(detectedLocale);

    // 加载翻译文件
    await this.loadAllTranslations();

    this.initialized = true;
    console.log(chalk.green(`🌐 ${this.t('app.welcome')}`));
  }

  private async loadAllTranslations(): Promise<void> {
    const supportedLocales = this.i18n.getSupportedLocales();
    
    for (const locale of supportedLocales) {
      try {
        // 在实际实现中，这里会从文件系统加载
        const translations = await this.loadTranslationFile(locale.code);
        await this.i18n.loadTranslations(locale.code, translations);
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  无法加载语言包: ${locale.code}`));
      }
    }
  }

  private async loadTranslationFile(locale: SupportedLocale): Promise<any> {
    // 模拟加载翻译文件
    const translations = {
      'zh-CN': () => import('../locales/zh-CN.json').then(m => m.default),
      'en-US': () => import('../locales/en-US.json').then(m => m.default),
      'ja-JP': () => import('../locales/ja-JP.json').then(m => m.default),
      'ko-KR': () => import('../locales/ko-KR.json').then(m => m.default)
    };

    const loader = translations[locale];
    if (loader) {
      return await loader();
    }

    throw new Error(`Translation file not found for locale: ${locale}`);
  }

  t(key: string, interpolations?: Record<string, string | number>): string {
    return this.i18n.t(key, interpolations);
  }

  async promptLanguageSelection(): Promise<SupportedLocale> {
    const locales = this.i18n.getSupportedLocales();
    
    const { selectedLocale } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedLocale',
      message: 'Select your preferred language / 选择您的语言 / 言語を選択 / 언어를 선택하세요:',
      choices: locales.map(locale => ({
        name: `${locale.nativeName} (${locale.name})`,
        value: locale.code
      }))
    }]);

    this.i18n.setLocale(selectedLocale);
    return selectedLocale;
  }

  async promptProjectLocalization(): Promise<{
    defaultLocale: SupportedLocale;
    supportedLocales: SupportedLocale[];
  }> {
    const allLocales = this.i18n.getSupportedLocales();
    
    // 选择默认语言
    const { defaultLocale } = await inquirer.prompt([{
      type: 'list',
      name: 'defaultLocale',
      message: this.t('commands.init.selectDefaultLocale') || 'Select default locale:',
      choices: allLocales.map(locale => ({
        name: `${locale.nativeName} (${locale.name})`,
        value: locale.code
      }))
    }]);

    // 选择支持的语言
    const { supportedLocales } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'supportedLocales',
      message: this.t('commands.init.selectSupportedLocales') || 'Select supported locales:',
      choices: allLocales.map(locale => ({
        name: `${locale.nativeName} (${locale.name})`,
        value: locale.code,
        checked: locale.code === defaultLocale
      })),
      validate: (choices: string[]) => {
        return choices.length > 0 || 'Please select at least one locale';
      }
    }]);

    return { defaultLocale, supportedLocales };
  }

  formatDate(date: Date): string {
    return this.i18n.formatDate(date);
  }

  formatTime(date: Date): string {
    return this.i18n.formatTime(date);
  }

  formatNumber(number: number): string {
    return this.i18n.formatNumber(number);
  }

  formatCurrency(amount: number): string {
    return this.i18n.formatCurrency(amount);
  }

  getCurrentLocale(): SupportedLocale {
    return this.i18n.getCurrentLocale();
  }

  getSupportedLocales(): any[] {
    return this.i18n.getSupportedLocales();
  }

  // 显示翻译统计
  async showTranslationStats(): Promise<void> {
    const stats = this.i18n.getTranslationStats();
    
    console.log(chalk.cyan('\n📊 Translation Statistics'));
    console.log(chalk.cyan('========================'));
    
    console.log(`Total translation keys: ${stats.totalKeys}`);
    console.log('');
    
    console.log('Completion rates by locale:');
    for (const locale of this.i18n.getSupportedLocales()) {
      const rate = stats.completionRate[locale.code];
      const translated = stats.translatedKeys[locale.code];
      const color = rate >= 100 ? chalk.green : rate >= 80 ? chalk.yellow : chalk.red;
      
      console.log(color(`  ${locale.nativeName}: ${rate.toFixed(1)}% (${translated}/${stats.totalKeys})`));
    }
    
    console.log('');
    
    // 显示缺失的翻译
    for (const locale of this.i18n.getSupportedLocales()) {
      const missing = stats.missingKeys[locale.code];
      if (missing.length > 0) {
        console.log(chalk.red(`Missing translations for ${locale.nativeName}:`));
        missing.slice(0, 5).forEach(key => {
          console.log(chalk.red(`  - ${key}`));
        });
        if (missing.length > 5) {
          console.log(chalk.red(`  ... and ${missing.length - 5} more`));
        }
        console.log('');
      }
    }
  }

  // 验证翻译完整性
  validateTranslations(): boolean {
    const stats = this.i18n.getTranslationStats();
    let isValid = true;
    
    for (const locale of this.i18n.getSupportedLocales()) {
      const rate = stats.completionRate[locale.code];
      if (rate < 100) {
        console.warn(chalk.yellow(`⚠️  ${locale.nativeName} translation is incomplete (${rate.toFixed(1)}%)`));
        isValid = false;
      }
    }
    
    if (isValid) {
      console.log(chalk.green('✅ All translations are complete'));
    }
    
    return isValid;
  }

  // 生成翻译报告
  generateTranslationReport(): string {
    const stats = this.i18n.getTranslationStats();
    const report = {
      timestamp: new Date().toISOString(),
      totalKeys: stats.totalKeys,
      locales: this.i18n.getSupportedLocales().map(locale => ({
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        completionRate: stats.completionRate[locale.code],
        translatedKeys: stats.translatedKeys[locale.code],
        missingKeys: stats.missingKeys[locale.code]
      }))
    };
    
    return JSON.stringify(report, null, 2);
  }
}