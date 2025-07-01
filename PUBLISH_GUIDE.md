# 📦 发布指导 - GitHub + npm 完整流程

## 🚀 第一步：创建GitHub仓库

### 方法1：使用GitHub CLI (推荐)
```bash
# 安装GitHub CLI (如果没有)
brew install gh

# 登录GitHub
gh auth login

# 创建公开仓库并推送
gh repo create team-code-review-mcp --public --description "MCP tool for team code review with one-click analysis and document-enhanced intelligence" --push
```

### 方法2：手动创建
1. 打开 https://github.com/new
2. Repository name: `team-code-review-mcp`
3. Description: `MCP tool for team code review with one-click analysis and document-enhanced intelligence`
4. 选择 Public
5. 不要初始化README、.gitignore或license (我们已经有了)
6. 点击 "Create repository"

然后执行：
```bash
git remote add origin https://github.com/admin/team-code-review-mcp.git
git branch -M main
git push -u origin main
```

## 📋 第二步：npm发布准备

### 1. 检查npm登录状态
```bash
npm whoami
```

如果没有登录：
```bash
npm login
```

### 2. 最终检查
```bash
# 检查包内容
npm pack --dry-run

# 运行测试
npm test

# 检查版本
npm version
```

## 🚀 第三步：发布到npm

```bash
# 发布包
npm publish

# 如果是第一次发布，可能需要：
npm publish --access public
```

## 📋 第四步：验证发布

### 检查npm包
```bash
npm info team-code-review-mcp
```

### 测试安装
```bash
# 在另一个目录测试
mkdir test-install && cd test-install
npx team-code-review-mcp --help
```

## 🏷️ 第五步：创建GitHub Release

```bash
# 使用GitHub CLI创建release
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
```

## 🎯 完整发布脚本

如果你想要一键执行，可以运行：

```bash
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
    gh release create v1.1.0 --title "v1.1.0 - Quick Analysis & Document Intelligence" --generate-notes
fi

echo "✅ 发布完成！"
echo "📦 npm包: https://www.npmjs.com/package/team-code-review-mcp"
echo "🐙 GitHub: https://github.com/admin/team-code-review-mcp"
```

## 🎉 发布后验证

1. **检查npm包页面**: https://www.npmjs.com/package/team-code-review-mcp
2. **检查GitHub仓库**: https://github.com/admin/team-code-review-mcp  
3. **测试全局安装**:
   ```bash
   npm install -g team-code-review-mcp
   team-code-review --help
   ```
4. **测试npx执行**:
   ```bash
   npx team-code-review-mcp quick --help
   ```

## 🔄 后续版本发布

对于后续版本：
```bash
# 更新版本号
npm version patch  # 或 minor, major

# 推送到GitHub
git push --follow-tags

# 发布到npm  
npm publish

# 创建GitHub Release
gh release create v$(node -p "require('./package.json').version") --generate-notes
``` 