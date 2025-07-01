#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TeamCodeAnalyzer } from './lib/analyzer.js';
import { ConfigManager } from './lib/config.js';
import { ReportGenerator } from './lib/report.js';
import chalk from 'chalk';

const server = new Server(
  {
    name: 'team-code-review-mcp',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize components
const configManager = new ConfigManager();
const analyzer = new TeamCodeAnalyzer();
const reportGenerator = new ReportGenerator();

// Define MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'setup_team_projects',
        description: 'Setup team projects configuration from environment variables or file',
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['env', 'file'],
              description: 'Configuration mode: env (from environment), file (from config file)',
              default: 'env'
            },
            configPath: {
              type: 'string',
              description: 'Path to configuration file when using file mode',
              default: './team-projects-config.json'
            }
          }
        }
      },
      {
        name: 'analyze_team_projects',
        description: 'Analyze multiple team projects and generate comprehensive diff reports',
        inputSchema: {
          type: 'object',
          properties: {
            outputPath: {
              type: 'string',
              description: 'Output directory for analysis reports',
              default: './team-analysis-reports'
            },
            includeRiskAnalysis: {
              type: 'boolean',
              description: 'Include security and performance risk analysis',
              default: true
            },
            includeOptimizationSuggestions: {
              type: 'boolean',
              description: 'Include code optimization suggestions',
              default: true
            },
            format: {
              type: 'string',
              enum: ['html', 'markdown', 'json'],
              description: 'Report output format',
              default: 'html'
            }
          }
        }
      },
      {
        name: 'validate_team_config',
        description: 'Validate team project configurations and check accessibility',
        inputSchema: {
          type: 'object',
          properties: {
            showDetails: {
              type: 'boolean',
              description: 'Show detailed validation information',
              default: true
            }
          }
        }
      },
      {
        name: 'add_team_project',
        description: 'Add a new project to team configuration',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name'
            },
            path: {
              type: 'string',
              description: 'Project directory path'
            },
            baseBranch: {
              type: 'string',
              description: 'Base branch name',
              default: 'main'
            },
            targetBranch: {
              type: 'string', 
              description: 'Target branch name',
              default: 'develop'
            }
          },
          required: ['name', 'path']
        }
      },
      {
        name: 'list_team_projects',
        description: 'List all configured team projects',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'quick_team_analysis',
        description: 'One-click analysis for all configured team projects with smart defaults',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Optional message describing what to focus on in analysis',
              default: 'Complete team analysis'
            }
          }
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'setup_team_projects':
        return await setupTeamProjects(args);
      case 'analyze_team_projects':
        return await analyzeTeamProjects(args);
      case 'validate_team_config':
        return await validateTeamConfig(args);
      case 'add_team_project':
        return await addTeamProject(args);
      case 'list_team_projects':
        return await listTeamProjects(args);
      case 'quick_team_analysis':
        return await quickTeamAnalysis(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ]
    };
  }
});

// Tool implementations
async function setupTeamProjects(args) {
  const { mode = 'env', configPath = './team-projects-config.json' } = args;
  
  try {
    const result = await configManager.setupProjects(mode, configPath);
    return {
      content: [
        {
          type: 'text',
          text: `${chalk.green('✅ Team projects setup successful!')}\n\n${result.message}\n\nConfigured projects:\n${result.projects.map(p => `- ${p.name}: ${p.path} (${p.baseBranch} -> ${p.targetBranch})`).join('\n')}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Setup failed: ${error.message}`);
  }
}

async function analyzeTeamProjects(args) {
  const { 
    outputPath = './team-analysis-reports',
    includeRiskAnalysis = true,
    includeOptimizationSuggestions = true,
    format = 'html'
  } = args;

  try {
    const projects = await configManager.getProjects();
    if (projects.length === 0) {
      throw new Error('No projects configured. Please run setup_team_projects first.');
    }

    const analysisResults = await analyzer.analyzeMultipleProjects(projects, {
      includeRiskAnalysis,
      includeOptimizationSuggestions
    });

    const reportPath = await reportGenerator.generateReport(analysisResults, {
      outputPath,
      format,
      includeRiskAnalysis,
      includeOptimizationSuggestions
    });

    return {
      content: [
        {
          type: 'text',
          text: `${chalk.green('📊 Team analysis completed!')}\n\nAnalyzed ${projects.length} projects\nReport generated: ${reportPath}\n\nSummary:\n${analysisResults.summary.map(s => `- ${s.project}: ${s.status} (${s.changes} changes, ${s.risks} risks)`).join('\n')}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

async function validateTeamConfig(args) {
  const { showDetails = true } = args;
  
  try {
    const validation = await configManager.validateConfiguration(showDetails);
    return {
      content: [
        {
          type: 'text',
          text: `${validation.isValid ? chalk.green('✅ Configuration valid') : chalk.red('❌ Configuration invalid')}\n\n${validation.message}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
}

async function addTeamProject(args) {
  const { name, path, baseBranch = 'main', targetBranch = 'develop' } = args;
  
  try {
    await configManager.addProject({ name, path, baseBranch, targetBranch });
    return {
      content: [
        {
          type: 'text',
          text: `${chalk.green('✅ Project added successfully!')}\n\nProject: ${name}\nPath: ${path}\nBranches: ${baseBranch} -> ${targetBranch}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to add project: ${error.message}`);
  }
}

async function listTeamProjects(args) {
  try {
    const projects = await configManager.getProjects();
    
    if (projects.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `${chalk.yellow('📋 No projects configured')}\n\nUse setup_team_projects or add_team_project to get started.`
          }
        ]
      };
    }

    const projectList = projects.map((p, index) => 
      `${index + 1}. ${chalk.cyan(p.name)}\n   Path: ${p.path}\n   Branches: ${p.baseBranch} -> ${p.targetBranch}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `${chalk.green('📋 Configured Team Projects')}\n\n${projectList}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }
}

async function quickTeamAnalysis(args) {
  const { message = 'Complete team analysis' } = args;
  
  try {
    const projects = await configManager.getProjects();
    if (projects.length === 0) {
      throw new Error('No projects configured. Please run setup_team_projects first.');
    }

    const analysisResults = await analyzer.analyzeMultipleProjects(projects, {
      includeRiskAnalysis: true,
      includeOptimizationSuggestions: true
    });

    const reportPath = await reportGenerator.generateReport(analysisResults, {
      outputPath: './team-analysis-reports',
      format: 'html',
      includeRiskAnalysis: true,
      includeOptimizationSuggestions: true
    });

    return {
      content: [
        {
          type: 'text',
          text: `${chalk.green('📊 Team analysis completed!')}\n\nAnalyzed ${projects.length} projects\nReport generated: ${reportPath}\n\nSummary:\n${analysisResults.summary.map(s => `- ${s.project}: ${s.status} (${s.changes} changes, ${s.risks} risks)`).join('\n')}\n\n${message}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Team Code Review MCP server running on stdio');
}

runServer().catch(console.error); 