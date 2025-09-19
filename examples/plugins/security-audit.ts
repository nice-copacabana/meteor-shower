export default {
  id: 'security-audit',
  name: '安全审计插件',
  version: '1.0.0',
  description: '自动检测配置中的安全风险',
  author: 'meteor-shower-team',
  enabled: true,
  dependencies: [],
  hooks: [
    {
      name: 'config:generate',
      handler: async (context: any) => {
        console.log('🔒 安全审计：检查配置安全性...');
        
        const config = context.data;
        const warnings: string[] = [];
        
        // 检查敏感信息
        if (config.content && config.content.includes('password')) {
          warnings.push('检测到可能的密码泄露');
        }
        
        if (config.content && config.content.includes('api_key')) {
          warnings.push('检测到 API 密钥，建议使用环境变量');
        }
        
        // 检查危险命令
        const dangerousCommands = ['rm -rf', 'sudo', 'chmod 777'];
        for (const cmd of dangerousCommands) {
          if (config.content && config.content.includes(cmd)) {
            warnings.push(`检测到危险命令: ${cmd}`);
          }
        }
        
        if (warnings.length > 0) {
          console.log('⚠️  安全警告:');
          warnings.forEach(warning => console.log(`  - ${warning}`));
        } else {
          console.log('✅ 安全检查通过');
        }
        
        return {
          ...config,
          securityWarnings: warnings
        };
      }
    }
  ]
};
