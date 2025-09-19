import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  dependencies: string[];
  hooks: PluginHook[];
}

export interface PluginHook {
  name: string;
  handler: (context: any) => Promise<any>;
}

export interface PluginContext {
  tool: string;
  action: string;
  data: any;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private pluginDir: string;

  constructor(pluginDir = 'plugins') {
    this.pluginDir = pluginDir;
  }

  async loadPlugin(pluginPath: string): Promise<Plugin> {
    try {
      const pluginModule = await import(pluginPath);
      const plugin: Plugin = pluginModule.default || pluginModule;
      
      // 验证插件格式
      if (!plugin.id || !plugin.name || !plugin.version) {
        throw new Error('插件格式无效：缺少必要字段');
      }
      
      this.plugins.set(plugin.id, plugin);
      this.registerHooks(plugin);
      
      console.log(chalk.green(`✅ 插件加载成功: ${plugin.name} v${plugin.version}`));
      return plugin;
    } catch (error) {
      console.error(chalk.red(`❌ 插件加载失败: ${pluginPath}`), error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    // 移除钩子
    for (const hook of plugin.hooks) {
      const hooks = this.hooks.get(hook.name) || [];
      const index = hooks.findIndex(h => h.handler === hook.handler);
      if (index >= 0) {
        hooks.splice(index, 1);
        this.hooks.set(hook.name, hooks);
      }
    }

    this.plugins.delete(pluginId);
    console.log(chalk.yellow(`🔄 插件卸载: ${plugin.name}`));
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    plugin.enabled = true;
    console.log(chalk.green(`✅ 插件启用: ${plugin.name}`));
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    plugin.enabled = false;
    console.log(chalk.yellow(`⏸️  插件禁用: ${plugin.name}`));
  }

  private registerHooks(plugin: Plugin): void {
    for (const hook of plugin.hooks) {
      if (!this.hooks.has(hook.name)) {
        this.hooks.set(hook.name, []);
      }
      this.hooks.get(hook.name)!.push(hook);
    }
  }

  async executeHook(hookName: string, context: PluginContext): Promise<any> {
    const hooks = this.hooks.get(hookName) || [];
    const enabledHooks = hooks.filter(hook => {
      const plugin = Array.from(this.plugins.values()).find(p => 
        p.hooks.some(h => h.handler === hook.handler)
      );
      return plugin?.enabled;
    });

    let result = context.data;
    
    for (const hook of enabledHooks) {
      try {
        result = await hook.handler({ ...context, data: result });
        const plugin = Array.from(this.plugins.values()).find(p => 
          p.hooks.some(h => h.handler === hook.handler)
        );
        console.log(chalk.gray(`🔗 钩子执行: ${hookName} -> ${plugin?.name || 'unknown'}`));
      } catch (error) {
        console.error(chalk.red(`❌ 钩子执行失败: ${hookName}`), error);
      }
    }

    return result;
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return this.listPlugins().filter(plugin => plugin.enabled);
  }

  async loadPluginsFromDirectory(): Promise<void> {
    try {
      const files = await fs.readdir(this.pluginDir);
      const pluginFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
      
      for (const file of pluginFiles) {
        const pluginPath = path.join(this.pluginDir, file);
        try {
          await this.loadPlugin(pluginPath);
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  跳过插件: ${file}`), error);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ 加载插件目录失败:'), error);
    }
  }

  // 预定义钩子
  async onConfigGenerate(context: PluginContext): Promise<any> {
    return this.executeHook('config:generate', context);
  }

  async onConfigApply(context: PluginContext): Promise<any> {
    return this.executeHook('config:apply', context);
  }

  async onTemplateLoad(context: PluginContext): Promise<any> {
    return this.executeHook('template:load', context);
  }

  async onUserAction(context: PluginContext): Promise<any> {
    return this.executeHook('user:action', context);
  }
}
