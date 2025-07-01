# 🚀 Team Code Review - 团队成员快速上手指南

## 1分钟快速开始

### Step 1: 配置环境变量 (一次性设置)

将以下内容添加到你的 shell 配置文件 (`~/.bashrc`, `~/.zshrc` 等):

```bash
# 团队代码审查工具配置
export TEAM_PROJECTS="项目1:路径1:基础分支:目标分支|项目2:路径2:基础分支:目标分支"

# 示例：
export TEAM_PROJECTS="frontend:/workspace/frontend:main:develop|backend:/workspace/backend:main:develop|mobile:/workspace/mobile:main:feature-branch"
```

### Step 2: 运行一键分析

```bash
# 方式1: 直接使用 (推荐)
npx team-code-review-mcp quick

# 方式2: 全局安装后使用
npm install -g team-code-review-mcp
team-code-review quick
```

## 💡 文档增强功能

### 在项目中添加文档支持

在每个项目根目录创建 `.document` 文件夹：

```
your-project/
├── .document/
│   ├── requirements.md      # 需求文档
│   ├── architecture.md      # 架构设计
│   ├── api-specification.md # API文档
│   ├── security-guide.md    # 安全指南
│   └── performance-notes.md # 性能要求
├── src/
└── ...
```

### 文档内容示例

**`.document/requirements.md`**:
```markdown
# 项目需求文档

## 用户认证模块
- 支持邮箱和手机号登录
- 实现JWT token认证
- 密码需要包含特殊字符
```

**`.document/architecture.md`**:
```markdown
# 架构设计

## 前端组件规范
- 单个组件不超过200行代码
- 使用TypeScript严格模式
- 必须包含单元测试
```

## 🎯 常用命令

```bash
# 快速分析 (推荐)
team-code-review quick

# 带消息的快速分析
team-code-review quick -m "Sprint 23 代码审查"

# 简写形式
team-code-review q

# 查看项目配置
team-code-review list

# 验证配置
team-code-review validate
```

## 🔧 环境变量格式详解

```bash
# 格式: "项目名:项目路径:基础分支:目标分支"
# 多个项目用 | 分隔

# 基本格式
export TEAM_PROJECTS="frontend:/path/to/frontend:main:develop"

# 多项目格式
export TEAM_PROJECTS="frontend:/path/to/frontend:main:develop|backend:/path/to/backend:master:release"

# 可选：设置默认分支 (当项目配置中未指定时使用)
export TEAM_BASE_BRANCH="main"
export TEAM_TARGET_BRANCH="develop"
```

## 📊 报告功能

运行分析后，会生成包含以下内容的详细报告：

- **📄 文档分析**: 自动扫描项目文档
- **🔍 代码变更**: 详细的文件变更统计
- **⚠️ 风险评估**: 基于文档上下文的智能风险检测
- **💡 优化建议**: 结合项目文档的改进建议

## 🆘 常见问题

**Q: 报错 "No projects configured"**
A: 检查 `TEAM_PROJECTS` 环境变量是否正确设置，运行 `echo $TEAM_PROJECTS` 确认

**Q: 项目路径找不到**
A: 确保路径存在且可访问，支持相对路径和绝对路径

**Q: Git分支不存在**
A: 工具会自动跳过不存在的分支，继续分析其他项目

**Q: 想要更详细的配置**
A: 运行 `team-code-review setup --mode file` 使用配置文件模式

## 🎉 团队协作建议

1. **统一环境变量**: 团队统一使用相同的 `TEAM_PROJECTS` 配置
2. **规范文档结构**: 在 `.document` 文件夹中保持一致的文档命名
3. **定期分析**: 在每次迭代结束时运行快速分析
4. **分享报告**: 将生成的HTML报告分享给团队成员

---

**🚀 一键分析，让代码审查变得简单高效！** 