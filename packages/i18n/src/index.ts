import chalk from 'chalk';

export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE';

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

export interface I18nOptions {
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  autoDetect: boolean;
  interpolation: {
    prefix: string;
    suffix: string;
  };
}

export class I18nManager {
  private currentLocale: SupportedLocale;
  private translations: Map<SupportedLocale, TranslationResource> = new Map();
  private options: I18nOptions;
  private localeConfigs: Map<SupportedLocale, LocaleConfig> = new Map();

  constructor(options: Partial<I18nOptions> = {}) {
    this.options = {
      defaultLocale: 'zh-CN',
      fallbackLocale: 'en-US',
      supportedLocales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
      autoDetect: true,
      interpolation: {
        prefix: '{{',
        suffix: '}}'
      },
      ...options
    };

    this.currentLocale = this.options.defaultLocale;
    this.initializeLocaleConfigs();
  }

  private initializeLocaleConfigs(): void {
    const configs: LocaleConfig[] = [
      {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        currency: 'CNY'
      },
      {
        code: 'en-US',
        name: 'English (United States)',
        nativeName: 'English',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'h:mm:ss A',
        currency: 'USD'
      },
      {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: 'HH:mm:ss',
        currency: 'JPY'
      },
      {
        code: 'ko-KR',
        name: 'Korean',
        nativeName: '한국어',
        direction: 'ltr',
        dateFormat: 'YYYY.MM.DD',
        timeFormat: 'HH:mm:ss',
        currency: 'KRW'
      },
      {
        code: 'es-ES',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currency: 'EUR'
      },
      {
        code: 'fr-FR',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currency: 'EUR'
      },
      {
        code: 'de-DE',
        name: 'German',
        nativeName: 'Deutsch',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        currency: 'EUR'
      }
    ];

    configs.forEach(config => {
      this.localeConfigs.set(config.code, config);
    });
  }

  async loadTranslations(locale: SupportedLocale, translations: TranslationResource): Promise<void> {
    this.translations.set(locale, translations);
    console.log(chalk.green(`✅ 加载语言包: ${locale}`));
  }

  async loadTranslationsFromFile(locale: SupportedLocale, filePath: string): Promise<void> {
    try {
      // 在实际实现中，这里会从文件系统读取
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(content);
      await this.loadTranslations(locale, translations);
    } catch (error) {
      console.error(chalk.red(`❌ 加载语言包失败: ${locale} from ${filePath}`), error);
    }
  }

  setLocale(locale: SupportedLocale): void {
    if (!this.options.supportedLocales.includes(locale)) {
      console.warn(chalk.yellow(`⚠️  不支持的语言: ${locale}, 使用默认语言 ${this.options.defaultLocale}`));
      locale = this.options.defaultLocale;
    }

    this.currentLocale = locale;
    console.log(chalk.blue(`🌐 切换语言: ${this.getLocaleConfig(locale)?.nativeName || locale}`));
  }

  getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  getLocaleConfig(locale?: SupportedLocale): LocaleConfig | undefined {
    return this.localeConfigs.get(locale || this.currentLocale);
  }

  getSupportedLocales(): LocaleConfig[] {
    return this.options.supportedLocales.map(locale => 
      this.localeConfigs.get(locale)!
    ).filter(Boolean);
  }

  t(key: string, interpolations: Record<string, string | number> = {}): string {
    const translation = this.getTranslation(key, this.currentLocale);
    return this.interpolate(translation, interpolations);
  }

  private getTranslation(key: string, locale: SupportedLocale): string {
    const translations = this.translations.get(locale);
    if (!translations) {
      return this.getFallbackTranslation(key);
    }

    const value = this.getNestedValue(translations, key);
    if (typeof value === 'string') {
      return value;
    }

    return this.getFallbackTranslation(key);
  }

  private getFallbackTranslation(key: string): string {
    if (this.currentLocale === this.options.fallbackLocale) {
      console.warn(chalk.yellow(`⚠️  缺少翻译: ${key}`));
      return key; // 返回 key 作为最后的后备
    }

    const fallbackTranslations = this.translations.get(this.options.fallbackLocale);
    if (!fallbackTranslations) {
      console.warn(chalk.yellow(`⚠️  缺少后备语言翻译: ${key}`));
      return key;
    }

    const value = this.getNestedValue(fallbackTranslations, key);
    if (typeof value === 'string') {
      return value;
    }

    console.warn(chalk.yellow(`⚠️  在后备语言中也缺少翻译: ${key}`));
    return key;
  }

  private getNestedValue(obj: TranslationResource, path: string): string | TranslationResource | undefined {
    return path.split('.').reduce((current: any, key: string) => {
      return current && current[key];
    }, obj);
  }

  private interpolate(text: string, values: Record<string, string | number>): string {
    let result = text;
    
    Object.entries(values).forEach(([key, value]) => {
      const placeholder = `${this.options.interpolation.prefix}${key}${this.options.interpolation.suffix}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return result;
  }

  // 格式化日期
  formatDate(date: Date, locale?: SupportedLocale): string {
    const config = this.getLocaleConfig(locale);
    if (!config) return date.toISOString();

    try {
      return new Intl.DateTimeFormat(config.code).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  // 格式化时间
  formatTime(date: Date, locale?: SupportedLocale): string {
    const config = this.getLocaleConfig(locale);
    if (!config) return date.toISOString();

    try {
      return new Intl.DateTimeFormat(config.code, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (error) {
      return date.toLocaleTimeString();
    }
  }

  // 格式化数字
  formatNumber(number: number, locale?: SupportedLocale): string {
    const config = this.getLocaleConfig(locale);
    if (!config) return number.toString();

    try {
      return new Intl.NumberFormat(config.code).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // 格式化货币
  formatCurrency(amount: number, locale?: SupportedLocale): string {
    const config = this.getLocaleConfig(locale);
    if (!config) return amount.toString();

    try {
      return new Intl.NumberFormat(config.code, {
        style: 'currency',
        currency: config.currency
      }).format(amount);
    } catch (error) {
      return `${amount} ${config.currency}`;
    }
  }

  // 复数形式处理
  plural(count: number, translations: { zero?: string; one: string; other: string }): string {
    if (count === 0 && translations.zero) {
      return translations.zero;
    } else if (count === 1) {
      return translations.one;
    } else {
      return translations.other;
    }
  }

  // 自动检测语言
  detectLocale(): SupportedLocale {
    if (!this.options.autoDetect) {
      return this.options.defaultLocale;
    }

    // 尝试从环境变量检测
    const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL;
    if (envLang) {
      const detected = this.parseLocaleFromString(envLang);
      if (detected && this.options.supportedLocales.includes(detected)) {
        return detected;
      }
    }

    // 尝试从系统区域设置检测
    try {
      const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
      const detected = this.parseLocaleFromString(systemLocale);
      if (detected && this.options.supportedLocales.includes(detected)) {
        return detected;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  无法检测系统语言'));
    }

    return this.options.defaultLocale;
  }

  private parseLocaleFromString(localeString: string): SupportedLocale | null {
    const normalized = localeString.toLowerCase().replace('_', '-');
    
    // 直接匹配
    for (const locale of this.options.supportedLocales) {
      if (normalized.startsWith(locale.toLowerCase())) {
        return locale;
      }
    }

    // 匹配语言代码
    const langCode = normalized.split('-')[0];
    const languageMap: Record<string, SupportedLocale> = {
      'zh': 'zh-CN',
      'en': 'en-US',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };

    return languageMap[langCode] || null;
  }

  // 获取翻译统计
  getTranslationStats(): {
    totalKeys: number;
    translatedKeys: Record<SupportedLocale, number>;
    missingKeys: Record<SupportedLocale, string[]>;
    completionRate: Record<SupportedLocale, number>;
  } {
    const allKeys = new Set<string>();
    
    // 收集所有翻译键
    for (const translations of this.translations.values()) {
      this.collectAllKeys(translations, '', allKeys);
    }

    const totalKeys = allKeys.size;
    const translatedKeys: Record<SupportedLocale, number> = {} as any;
    const missingKeys: Record<SupportedLocale, string[]> = {} as any;
    const completionRate: Record<SupportedLocale, number> = {} as any;

    for (const locale of this.options.supportedLocales) {
      const translations = this.translations.get(locale);
      const translated = new Set<string>();
      const missing: string[] = [];

      if (translations) {
        this.collectAllKeys(translations, '', translated);
      }

      for (const key of allKeys) {
        if (!translated.has(key)) {
          missing.push(key);
        }
      }

      translatedKeys[locale] = translated.size;
      missingKeys[locale] = missing;
      completionRate[locale] = totalKeys > 0 ? (translated.size / totalKeys) * 100 : 0;
    }

    return {
      totalKeys,
      translatedKeys,
      missingKeys,
      completionRate
    };
  }

  private collectAllKeys(obj: TranslationResource, prefix: string, keys: Set<string>): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        keys.add(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        this.collectAllKeys(value, fullKey, keys);
      }
    });
  }
}