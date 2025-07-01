#!/bin/bash

# Team Code Review MCP - Environment Setup Example
# Copy this file and customize for your team

# Set your team projects
# Format: "name:path:baseBranch:targetBranch|name:path:baseBranch:targetBranch"
export TEAM_PROJECTS="frontend:/workspace/frontend:main:develop|backend:/workspace/backend:main:develop|mobile:/workspace/mobile:main:feature-branch"

# Optional: Set default branches (will be used if not specified per project)
export TEAM_BASE_BRANCH="main"
export TEAM_TARGET_BRANCH="develop"

# Optional: Set report preferences
export TEAM_REPORT_OUTPUT="./team-analysis-reports"
export TEAM_REPORT_FORMAT="html"  # html, markdown, or json

echo "Team Code Review MCP environment configured!"
echo "Projects: $TEAM_PROJECTS"
echo ""
echo "Run 'team-code-review setup --mode env' to initialize"
echo "Run 'team-code-review analyze' to start analysis" 