# Team Code Review MCP

一个强大的MCP (Model Context Protocol) 工具，用于团队代码审查和跨多项目的深度分析。专为开发团队设计，帮助在单一工作流程中高效分析多个仓库的代码变更、识别风险并获得优化建议。

## 🚀 特性

- **多项目分析**: 同时分析多个项目
- **环境变量配置**: 通过环境变量轻松设置
- **分支比较**: 任意两个分支间的深度差异分析
- **风险评估**: 自动检测安全、性能和代码质量风险
- **优化建议**: AI驱动的代码优化建议
- **多种输出格式**: HTML、Markdown和JSON报告
- **Git集成**: 与Git仓库无缝集成
- **团队友好**: 专为团队协作和共享配置设计

## 📦 安装

### 从NPM安装 (推荐)

```bash
npm install -g team-code-review-mcp
```

### 从源码安装

```bash
git clone https://github.com/your-org/team-code-review-mcp.git
cd team-code-review-mcp
npm install
npm link
```

## 🔧 配置

### 环境变量设置

最简单的配置方式是通过环境变量：

```bash
# 设置项目配置
export TEAM_PROJECTS="project1:/path/to/project1:main:develop|project2:/path/to/project2:master:feature-branch"

# 可选：设置默认分支
export TEAM_BASE_BRANCH="main"
export TEAM_TARGET_BRANCH="develop"
```

### 配置文件设置

创建配置文件 `~/.team-code-review-config.json`:

```json
{
  "projects": [
    {
      "name": "frontend",
      "path": "/Users/dev/projects/frontend",
      "baseBranch": "main",
      "targetBranch": "develop"
    },
    {
      "name": "backend-api",
      "path": "/Users/dev/projects/backend",
      "baseBranch": "master",
      "targetBranch": "feature/new-api"
    }
  ]
}
```

## 🎯 使用方法

### 作为MCP工具使用 (推荐)

与MCP兼容的客户端（如Claude Desktop）一起使用：

1. 添加到你的MCP配置中
2. 使用以下工具：
   - `setup_team_projects` - 配置项目
   - `analyze_team_projects` - 运行综合分析
   - `validate_team_config` - 验证配置
   - `add_team_project` - 添加新项目
   - `list_team_projects` - 列出配置的项目

### 命令行接口

```bash
# 从环境变量设置项目
team-code-review setup --mode env

# 从配置文件设置
team-code-review setup --mode file --config ./my-config.json

# 分析所有项目
team-code-review analyze

# 使用特定选项分析
team-code-review analyze --output ./reports --format html --include-risks --include-optimizations

# 验证配置
team-code-review validate

# 添加新项目
team-code-review add --name "new-project" --path "/path/to/project" --base main --target develop

# 列出项目
team-code-review list
```

## 🛠 MCP工具参考

### setup_team_projects

从各种来源配置团队项目。

**参数:**
- `mode` (string): 配置模式 - `env` 或 `file`
- `configPath` (string): 配置文件路径（使用文件模式时）

### analyze_team_projects

分析配置的项目并生成报告。

**参数:**
- `outputPath` (string): 报告输出目录
- `includeRiskAnalysis` (boolean): 包含安全和性能风险分析
- `includeOptimizationSuggestions` (boolean): 包含代码优化建议
- `format` (string): 报告格式 - `html`、`markdown` 或 `json`

## 📊 报告功能

### 风险分析
- **安全风险**: 检测潜在安全漏洞
- **性能风险**: 识别性能瓶颈
- **代码质量风险**: 发现代码质量问题

### 优化建议
- **架构改进**: 组件和结构优化
- **性能增强**: 代码性能改进
- **最佳实践**: 现代编码标准和实践

## 🔍 配置示例

### 简单团队设置

```bash
export TEAM_PROJECTS="frontend:/home/team/frontend:main:develop|backend:/home/team/backend:main:develop|mobile:/home/team/mobile:main:feature-branch"
```

### 复杂多环境设置

```json
{
  "projects": [
    {
      "name": "web-frontend",
      "path": "/workspace/frontend",
      "baseBranch": "main",
      "targetBranch": "develop"
    },
    {
      "name": "api-gateway",
      "path": "/workspace/api-gateway",
      "baseBranch": "master",
      "targetBranch": "release/v2.0"
    }
  ]
}
```

## 📄 许可证

MIT许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

1. Fork仓库
2. 创建功能分支
3. 进行更改
4. 添加测试
5. 提交PR

---

**为希望更好代码审查工作流程的开发团队而制作 ❤️** 