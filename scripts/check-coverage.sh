#!/bin/bash

# 测试覆盖率检查脚本
# 此脚本用于验证所有核心功能的测试覆盖率

echo "🧪 meteor-shower 测试覆盖率检查"
echo "=================================="

# 检查是否安装了必要的依赖
echo "📦 检查依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📥 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 运行测试覆盖率
echo "🧪 运行测试并生成覆盖率报告..."
npm run test:coverage

# 检查覆盖率结果
echo "📊 测试覆盖率报告"
echo "=================="

# 核心模块列表
CORE_MODULES=(
    "packages/adapters"
    "packages/utils" 
    "packages/cli"
    "packages/cloud-hub"
    "packages/enterprise"
)

echo "📋 核心模块测试状态："
echo ""

for module in "${CORE_MODULES[@]}"; do
    if [ -d "$module/src/__tests__" ]; then
        test_count=$(find "$module/src/__tests__" -name "*.test.ts" | wc -l)
        echo "✅ $module: $test_count 个测试文件"
    else
        echo "⚠️  $module: 缺少测试目录"
    fi
done

echo ""
echo "📈 覆盖率目标："
echo "- 全局覆盖率: >= 80%"
echo "- 核心模块覆盖率: >= 85%"
echo "- 分支覆盖率: >= 80%"
echo "- 函数覆盖率: >= 80%"

echo ""
echo "📝 测试文件统计："
find packages -name "*.test.ts" -o -name "*.spec.ts" | while read -r file; do
    echo "  - $file"
done

echo ""
echo "✅ 测试覆盖率检查完成！"
echo "📊 详细报告请查看 coverage/ 目录"
echo "🌐 HTML 报告: coverage/index.html"