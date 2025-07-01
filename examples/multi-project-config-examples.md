# 🔧 多项目配置示例

## 基本多项目配置

### 1. 相同分支结构的项目

```json
{
  "mcpServers": {
    "team-code-review": {
      "command": "npx",
      "args": ["-y", "team-code-review-mcp"],
      "env": {
        "TEAM_PROJECTS": "frontend:/workspace/frontend:main:develop|backend:/workspace/backend:main:develop|mobile:/workspace/mobile:main:develop",
        "TEAM_BASE_BRANCH": "main",
        "TEAM_TARGET_BRANCH": "develop"
      }
    }
  }
}
```

### 2. 不同分支结构的项目

```json
{
  "mcpServers": {
    "team-code-review": {
      "command": "npx",
      "args": ["-y", "team-code-review-mcp"],
      "env": {
        "TEAM_PROJECTS": "frontend:/workspace/frontend:main:develop|backend:/workspace/backend:master:release|admin:/workspace/admin:main:feature/v2|mobile:/workspace/mobile:develop:feature/sprint-23|api-gateway:/workspace/gateway:trunk:integration"
      }
    }
  }
}
```

## 复杂项目配置示例

### 1. 大型企业级配置

```bash
# 环境变量配置
export TEAM_PROJECTS="
web-frontend:/workspace/web-frontend:main:develop|
mobile-ios:/workspace/mobile-ios:main:release/v2.1|
mobile-android:/workspace/mobile-android:develop:feature/new-ui|
backend-api:/workspace/backend-api:master:staging|
admin-portal:/workspace/admin-portal:main:feature/dashboard|
microservice-auth:/workspace/auth-service:main:hotfix/security|
microservice-payment:/workspace/payment-service:develop:feature/stripe-integration|
legacy-system:/workspace/legacy:production:maintenance|
data-pipeline:/workspace/data-pipeline:trunk:feature/kafka-migration|
monitoring:/workspace/monitoring:main:develop
"
```

对应的Claude Desktop配置：

```json
{
  "mcpServers": {
    "team-code-review": {
      "command": "npx", 
      "args": ["-y", "team-code-review-mcp"],
      "env": {
        "TEAM_PROJECTS": "web-frontend:/workspace/web-frontend:main:develop|mobile-ios:/workspace/mobile-ios:main:release/v2.1|mobile-android:/workspace/mobile-android:develop:feature/new-ui|backend-api:/workspace/backend-api:master:staging|admin-portal:/workspace/admin-portal:main:feature/dashboard|microservice-auth:/workspace/auth-service:main:hotfix/security|microservice-payment:/workspace/payment-service:develop:feature/stripe-integration|legacy-system:/workspace/legacy:production:maintenance|data-pipeline:/workspace/data-pipeline:trunk:feature/kafka-migration|monitoring:/workspace/monitoring:main:develop"
      }
    }
  }
}
```

### 2. 分环境配置

**开发环境：**
```bash
export TEAM_PROJECTS="
frontend:/dev/frontend:develop:feature/user-auth|
backend:/dev/backend:develop:feature/api-v2|
admin:/dev/admin:develop:feature/new-dashboard
"
```

**测试环境：**
```bash  
export TEAM_PROJECTS="
frontend:/test/frontend:main:test/integration|
backend:/test/backend:main:test/performance|
admin:/test/admin:main:test/e2e
"
```

**生产环境：**
```bash
export TEAM_PROJECTS="
frontend:/prod/frontend:main:hotfix/critical|
backend:/prod/backend:release:hotfix/security|
admin:/prod/admin:production:hotfix/urgent
"
```

## 特殊场景配置

### 1. Git Flow 工作流项目

```bash
export TEAM_PROJECTS="
main-app:/workspace/main-app:develop:feature/user-management|
core-lib:/workspace/core-lib:develop:feature/performance|
api-service:/workspace/api-service:develop:release/v3.0
"
```

### 2. GitHub Flow 工作流项目

```bash
export TEAM_PROJECTS="
webapp:/workspace/webapp:main:feature/redesign|
api:/workspace/api:main:feature/graphql|
docs:/workspace/docs:main:feature/new-guides
"
```

### 3. 混合工作流团队

```bash
export TEAM_PROJECTS="
legacy-monolith:/workspace/legacy:master:develop|
new-microservice:/workspace/microservice:main:feature/containerization|
frontend-spa:/workspace/frontend:develop:feature/react-18|
mobile-app:/workspace/mobile:trunk:branch/ios-updates
"
```

## 项目路径类型支持

### 1. 绝对路径

```bash
export TEAM_PROJECTS="
frontend:/Users/team/projects/frontend:main:develop|
backend:/home/ubuntu/workspace/backend:master:staging
"
```

### 2. 相对路径（相对于工作目录）

```bash
export TEAM_PROJECTS="
frontend:./frontend:main:develop|
backend:../backend:main:develop|
shared:../../shared-libs:main:develop
"
```

### 3. 混合路径配置

```bash
export TEAM_PROJECTS="
local-frontend:./frontend:main:develop|
remote-backend:/workspace/backend:master:staging|
shared-lib:../shared:main:develop
"
```

## 团队协作配置模板

### 1. 小型团队 (2-5人)

```bash
export TEAM_PROJECTS="
webapp:/workspace/webapp:main:develop|
api:/workspace/api:main:develop|
mobile:/workspace/mobile:main:develop
"
```

### 2. 中型团队 (5-15人)

```bash
export TEAM_PROJECTS="
frontend:/workspace/frontend:main:develop|
backend:/workspace/backend:main:develop|
admin:/workspace/admin:main:develop|
mobile-ios:/workspace/mobile-ios:main:release/v2|
mobile-android:/workspace/mobile-android:main:release/v2|
shared-components:/workspace/shared:main:develop
"
```

### 3. 大型团队 (15+人)

```bash
export TEAM_PROJECTS="
web-client:/workspace/web-client:main:develop|
admin-client:/workspace/admin-client:main:develop|
user-service:/workspace/user-service:main:develop|
order-service:/workspace/order-service:main:develop|
payment-service:/workspace/payment-service:main:develop|
notification-service:/workspace/notification-service:main:develop|
gateway:/workspace/api-gateway:main:develop|
mobile-ios:/workspace/mobile-ios:main:release/current|
mobile-android:/workspace/mobile-android:main:release/current|
shared-libs:/workspace/shared-libraries:main:develop|
infrastructure:/workspace/infrastructure:main:develop|
monitoring:/workspace/monitoring:main:develop
"
```

## 最佳实践建议

### 1. 命名规范

- 使用描述性的项目名称
- 避免空格和特殊字符
- 使用连字符分隔多个单词

### 2. 分支命名规范

- 保持分支命名的一致性
- 使用团队约定的分支命名模式
- 避免过长的分支名称

### 3. 路径管理

- 优先使用绝对路径确保一致性
- 确保所有团队成员使用相同的路径结构
- 定期验证路径的有效性

### 4. 环境管理

- 为不同环境创建不同的配置
- 使用环境变量管理配置
- 定期更新和同步配置 