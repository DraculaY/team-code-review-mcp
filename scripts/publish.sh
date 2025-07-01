#!/bin/bash
set -e

echo "🚀 开始发布 team-code-review-mcp..."

# 检查是否登录npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ 请先登录npm: npm login"
    exit 1
fi

# 运行测试
echo "🧪 运行测试..."
npm test

# 检查包内容
echo "📦 检查包内容..."
npm pack --dry-run

# 创建GitHub仓库并推送 (使用GitHub CLI)
if command -v gh > /dev/null 2>&1; then
    echo "📦 创建GitHub仓库..."
    gh repo create team-code-review-mcp --public --description "MCP tool for team code review with one-click analysis and document-enhanced intelligence" --push
else
    echo "⚠️  请手动创建GitHub仓库，然后运行:"
    echo "git remote add origin https://github.com/admin/team-code-review-mcp.git"
    echo "git push -u origin main"
    read -p "按Enter继续npm发布..."
fi

# 发布到npm
echo "📦 发布到npm..."
npm publish

# 创建GitHub Release
if command -v gh > /dev/null 2>&1; then
    echo "🏷️  创建GitHub Release..."
    gh release create v1.1.0 --title "v1.1.0 - Quick Analysis & Document Intelligence" --notes "
## 🚀 新功能
- ✨ 一键快速分析命令 \`team-code-review quick\`
- 📚 文档智能分析 (.document 文件夹扫描)
- 🔍 增强的风险评估与文档感知分析
- 💡 基于项目文档的智能优化建议
- 🎨 现代化响应式HTML报告
- 📖 全面的多项目配置示例

## 🛠️ 改进
- 更新CLI命令和自动设置回退
- 增强的报告生成器和模板
- 改进的用户体验和错误处理

## 📚 文档
- 新增快速设置指南
- 多项目配置示例
- 交互式演示脚本
"
fi

echo "✅ 发布完成！"
echo "📦 npm包: https://www.npmjs.com/package/team-code-review-mcp"
echo "🐙 GitHub: https://github.com/admin/team-code-review-mcp"
echo ""
echo "🎉 验证步骤:"
echo "1. 检查 https://www.npmjs.com/package/team-code-review-mcp"
echo "2. 测试: npx team-code-review-mcp --help"
echo "3. 测试: npx team-code-review-mcp quick --help" 