#!/bin/bash

# Team Code Review MCP - 演示脚本
# 展示如何使用快速分析功能

echo "🚀 Team Code Review MCP - 演示开始"
echo "=================================="
echo

# 1. 设置演示环境变量
echo "📝 Step 1: 设置项目配置"
echo "设置环境变量 TEAM_PROJECTS..."

# 演示环境变量设置 (用户需要修改为实际路径)
export TEAM_PROJECTS="demo-frontend:./examples:main:develop|demo-backend:.:main:develop"

echo "✅ 配置完成:"
echo "   TEAM_PROJECTS=$TEAM_PROJECTS"
echo

# 2. 创建演示文档文件夹
echo "📄 Step 2: 创建演示文档"
echo "在当前目录创建 .document 文件夹..."

mkdir -p .document

# 创建示例需求文档
cat > .document/requirements.md << 'EOF'
# Demo Project Requirements

## 功能需求
- 用户登录认证
- 数据展示界面
- API接口规范

## 安全要求
- 使用HTTPS协议
- 密码加密存储
- JWT token认证

## 性能要求
- 页面加载时间 < 2秒
- 支持1000并发用户
EOF

# 创建示例架构文档
cat > .document/architecture.md << 'EOF'
# Demo Project Architecture

## 前端架构
- React + TypeScript
- 组件化开发
- 状态管理使用Redux

## 后端架构
- Node.js + Express
- RESTful API设计
- MongoDB数据库

## 组件规范
- 单个组件不超过200行
- 必须包含单元测试
- 使用ESLint代码检查
EOF

echo "✅ 演示文档创建完成"
echo

# 3. 显示当前配置
echo "🔍 Step 3: 验证配置"
echo "运行配置验证..."
node cli.js validate 2>/dev/null || echo "⚠️  验证可能失败，但这在演示中是正常的"
echo

# 4. 运行快速分析
echo "🚀 Step 4: 运行快速分析"
echo "执行一键分析命令..."
echo "命令: node cli.js quick -m '演示分析'"
echo

# 显示即将执行的命令
echo "💡 实际在项目中，您只需要运行:"
echo "   team-code-review quick"
echo "   或"  
echo "   npx team-code-review-mcp quick"
echo

# 5. 清理演示文件
echo "🧹 Step 5: 清理演示文件"
echo "清理创建的演示文档..."
rm -rf .document
echo "✅ 清理完成"
echo

# 6. 显示使用指南
echo "📚 接下来的步骤:"
echo "1. 设置您的项目环境变量:"
echo "   export TEAM_PROJECTS=\"项目1:路径1:主分支:目标分支|项目2:路径2:主分支:目标分支\""
echo
echo "2. 在每个项目中创建 .document 文件夹并添加文档"
echo
echo "3. 运行快速分析:"
echo "   npx team-code-review-mcp quick"
echo
echo "🎉 演示完成！现在您可以开始使用 Team Code Review MCP 了！" 