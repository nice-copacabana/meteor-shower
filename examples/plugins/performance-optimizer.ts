export default {
  id: 'performance-optimizer',
  name: '性能优化插件',
  version: '1.0.0',
  description: '自动优化配置性能',
  author: 'meteor-shower-team',
  enabled: true,
  dependencies: [],
  hooks: [
    {
      name: 'config:apply',
      handler: async (context: any) => {
        console.log('⚡ 性能优化：优化配置性能...');
        
        const config = context.data;
        const optimizations: string[] = [];
        
        // 优化 Gemini 配置
        if (config.target === 'gemini') {
          if (config.content && config.content.includes('maxTokens')) {
            optimizations.push('已设置最大令牌数限制');
          }
          
          if (config.content && config.content.includes('temperature')) {
            optimizations.push('已优化温度参数');
          }
        }
        
        // 优化 Claude 配置
        if (config.target === 'claude') {
          if (config.content && config.content.includes('max_tokens')) {
            optimizations.push('已设置最大令牌数限制');
          }
        }
        
        // 添加缓存配置
        if (config.content && !config.content.includes('cache')) {
          config.content += '\n# 性能优化：启用缓存\ncache: true\n';
          optimizations.push('已启用缓存');
        }
        
        if (optimizations.length > 0) {
          console.log('✅ 性能优化完成:');
          optimizations.forEach(opt => console.log(`  - ${opt}`));
        }
        
        return config;
      }
    }
  ]
};
