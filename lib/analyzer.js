import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export class TeamCodeAnalyzer {
  constructor() {
    this.riskPatterns = {
      security: [
        /password\s*=\s*["'][^"']*["']/gi,
        /api[_-]?key\s*=\s*["'][^"']*["']/gi,
        /secret\s*=\s*["'][^"']*["']/gi,
        /eval\s*\(/gi,
        /innerHTML\s*=/gi
      ],
      performance: [
        /for\s*\(\s*.*\s*in\s*.*\)\s*\{[\s\S]*for\s*\(/gi,
        /console\.log\(/gi,
        /debugger;?/gi
      ],
      codeQuality: [
        /TODO:/gi,
        /FIXME:/gi,
        /var\s+/gi,
        /==\s*[^=]/gi
      ]
    };
  }

  async analyzeMultipleProjects(projects, options = {}) {
    const { includeRiskAnalysis = true, includeOptimizationSuggestions = true } = options;
    const spinner = ora('Analyzing team projects...').start();
    
    const results = {
      summary: [],
      projects: [],
      totalRisks: 0,
      totalChanges: 0,
      analysisDate: new Date().toISOString()
    };

    for (const project of projects) {
      try {
        spinner.text = `Analyzing ${project.name}...`;
        
        const projectAnalysis = await this.analyzeProject(project, {
          includeRiskAnalysis,
          includeOptimizationSuggestions
        });

        results.projects.push(projectAnalysis);
        results.totalRisks += projectAnalysis.risks.total;
        results.totalChanges += projectAnalysis.changes.length;

        results.summary.push({
          project: project.name,
          status: projectAnalysis.status,
          changes: projectAnalysis.changes.length,
          risks: projectAnalysis.risks.total,
          branch: `${project.baseBranch} -> ${project.targetBranch}`
        });

      } catch (error) {
        console.warn(`${chalk.yellow('Warning:')} Failed to analyze ${project.name}: ${error.message}`);
        
        results.summary.push({
          project: project.name,
          status: 'error',
          error: error.message,
          changes: 0,
          risks: 0
        });
      }
    }

    spinner.succeed(`Analysis completed for ${projects.length} projects`);
    return results;
  }

  async analyzeProject(project, options = {}) {
    const { includeRiskAnalysis = true, includeOptimizationSuggestions = true } = options;
    const git = simpleGit(project.path);

    try {
      const status = await git.status();
      const diff = await this.getBranchDiff(git, project.baseBranch, project.targetBranch);
      const changes = await this.analyzeChanges(diff);

      const documentation = await this.analyzeDocumentation(project.path);

      let risks = { security: [], performance: [], codeQuality: [], total: 0 };
      if (includeRiskAnalysis) {
        risks = await this.analyzeRisks(changes, documentation);
      }

      let optimizations = [];
      if (includeOptimizationSuggestions) {
        optimizations = await this.generateOptimizations(changes, documentation);
      }

      return {
        project: project.name,
        path: project.path,
        branches: { base: project.baseBranch, target: project.targetBranch },
        status: 'success',
        gitStatus: {
          current: status.current,
          ahead: status.ahead,
          behind: status.behind,
          modified: status.modified.length,
          staged: status.staged.length
        },
        changes,
        risks,
        optimizations,
        documentation,
        analysis: {
          linesAdded: changes.reduce((sum, c) => sum + c.additions, 0),
          linesDeleted: changes.reduce((sum, c) => sum + c.deletions, 0),
          filesChanged: changes.length
        }
      };

    } catch (error) {
      throw new Error(`Git analysis failed: ${error.message}`);
    }
  }

  async getBranchDiff(git, baseBranch, targetBranch) {
    try {
      const branches = await git.branch();
      const localBranches = branches.all.filter(b => !b.startsWith('remotes/'));
      
      if (!localBranches.includes(baseBranch)) {
        throw new Error(`Base branch '${baseBranch}' not found`);
      }

      if (!localBranches.includes(targetBranch)) {
        throw new Error(`Target branch '${targetBranch}' not found`);
      }

      const diffSummary = await git.diffSummary([`${baseBranch}...${targetBranch}`]);
      const diffDetail = await git.diff([`${baseBranch}...${targetBranch}`]);

      return { summary: diffSummary, detail: diffDetail };

    } catch (error) {
      throw new Error(`Failed to get branch diff: ${error.message}`);
    }
  }

  async analyzeChanges(diff) {
    const changes = [];

    if (!diff.summary || !diff.summary.files) {
      return changes;
    }

    for (const file of diff.summary.files) {
      const fileAnalysis = {
        file: file.file,
        additions: file.insertions || 0,
        deletions: file.deletions || 0,
        changes: (file.insertions || 0) + (file.deletions || 0),
        type: this.getFileType(file.file),
        riskLevel: 'low'
      };

      if (fileAnalysis.changes > 100) {
        fileAnalysis.riskLevel = 'high';
      } else if (fileAnalysis.changes > 50) {
        fileAnalysis.riskLevel = 'medium';
      }

      if (file.file.includes('config') || file.file.includes('env')) {
        fileAnalysis.riskLevel = 'high';
      }

      changes.push(fileAnalysis);
    }

    return changes.sort((a, b) => b.changes - a.changes);
  }

  async analyzeRisks(changes, documentation) {
    const risks = { security: [], performance: [], codeQuality: [], total: 0 };

    for (const change of changes) {
      if (change.file.includes('auth') || change.file.includes('login')) {
        let message = 'Authentication related changes detected';
        let contextInfo = '';
        
        // 结合文档分析
        if (documentation && documentation.hasDocuments) {
          const securityDocs = documentation.documents.filter(doc => 
            doc.fullContent.toLowerCase().includes('auth') || 
            doc.fullContent.toLowerCase().includes('security') ||
            doc.fullContent.toLowerCase().includes('login')
          );
          
          if (securityDocs.length > 0) {
            contextInfo = `Found ${securityDocs.length} security-related documents. Please ensure changes align with documented security requirements.`;
          }
        }

        risks.security.push({
          file: change.file,
          type: 'authentication',
          message: message,
          contextInfo: contextInfo,
          severity: 'high'
        });
      }

      if (change.changes > 100) {
        let message = `Large changes (${change.changes} lines) may affect performance`;
        let contextInfo = '';
        
        // 结合文档分析
        if (documentation && documentation.hasDocuments) {
          const perfDocs = documentation.documents.filter(doc => 
            doc.fullContent.toLowerCase().includes('performance') || 
            doc.fullContent.toLowerCase().includes('optimization') ||
            doc.fullContent.toLowerCase().includes('性能')
          );
          
          if (perfDocs.length > 0) {
            contextInfo = `Found performance-related documentation. Consider reviewing performance requirements before deploying large changes.`;
          }
        }

        risks.performance.push({
          file: change.file,
          type: 'large-change',
          message: message,
          contextInfo: contextInfo,
          severity: 'medium'
        });
      }

      if (change.file.includes('test') && change.deletions > change.additions) {
        let message = 'Test code reduction detected';
        let contextInfo = '';
        
        // 结合文档分析
        if (documentation && documentation.hasDocuments) {
          const testDocs = documentation.documents.filter(doc => 
            doc.fullContent.toLowerCase().includes('test') || 
            doc.fullContent.toLowerCase().includes('testing') ||
            doc.fullContent.toLowerCase().includes('测试')
          );
          
          if (testDocs.length > 0) {
            contextInfo = `Found testing documentation. Please ensure test coverage requirements are maintained.`;
          }
        }

        risks.codeQuality.push({
          file: change.file,
          type: 'test-reduction',
          message: message,
          contextInfo: contextInfo,
          severity: 'high'
        });
      }

      // 新增：基于文档的API风险检测
      if (documentation && documentation.apis.length > 0 && change.file.includes('api')) {
        const relatedApiDocs = documentation.apis.filter(doc => 
          change.file.includes(doc.name.replace(/\.[^/.]+$/, '')) ||
          doc.fullContent.toLowerCase().includes(change.file.toLowerCase())
        );
        
        if (relatedApiDocs.length > 0) {
          risks.security.push({
            file: change.file,
            type: 'api-change',
            message: 'API changes detected with existing documentation',
            contextInfo: `Found ${relatedApiDocs.length} related API documents. Ensure changes are backward compatible and documented.`,
            severity: 'medium'
          });
        }
      }
    }

    risks.total = risks.security.length + risks.performance.length + risks.codeQuality.length;
    return risks;
  }

  async generateOptimizations(changes, documentation) {
    const optimizations = [];

    for (const change of changes) {
      if (this.getFileType(change.file) === 'javascript') {
        let suggestion = 'Consider using modern ES6+ features';
        let reasoning = 'Modern JavaScript features improve code readability and performance';
        
        // 结合文档分析
        if (documentation && documentation.architecture.length > 0) {
          const archDocs = documentation.architecture.filter(doc => 
            doc.fullContent.toLowerCase().includes('javascript') ||
            doc.fullContent.toLowerCase().includes('frontend') ||
            doc.fullContent.toLowerCase().includes('前端')
          );
          
          if (archDocs.length > 0) {
            reasoning += '. Architecture documentation suggests following modern JS patterns.';
          }
        }

        optimizations.push({
          file: change.file,
          type: 'code-quality',
          suggestion: suggestion,
          reasoning: reasoning,
          priority: 'medium'
        });
      }

      if (change.file.includes('component') && change.changes > 50) {
        let suggestion = 'Consider breaking large components into smaller ones';
        let reasoning = 'Smaller components are easier to maintain and test';
        
        // 结合文档分析
        if (documentation && documentation.architecture.length > 0) {
          const componentDocs = documentation.architecture.filter(doc => 
            doc.fullContent.toLowerCase().includes('component') ||
            doc.fullContent.toLowerCase().includes('module') ||
            doc.fullContent.toLowerCase().includes('组件')
          );
          
          if (componentDocs.length > 0) {
            reasoning += '. Architecture documentation may contain component design guidelines.';
          }
        }

        optimizations.push({
          file: change.file,
          type: 'architecture',
          suggestion: suggestion,
          reasoning: reasoning,
          priority: 'high'
        });
      }

      // 新增：基于需求文档的优化建议
      if (documentation && documentation.requirements.length > 0) {
        const relatedRequirements = documentation.requirements.filter(doc => 
          change.file.includes(doc.name.replace(/\.[^/.]+$/, '')) ||
          doc.fullContent.toLowerCase().includes(change.file.toLowerCase().replace(/\.[^/.]+$/, ''))
        );
        
        if (relatedRequirements.length > 0) {
          optimizations.push({
            file: change.file,
            type: 'requirements-alignment',
            suggestion: 'Verify implementation aligns with documented requirements',
            reasoning: `Found ${relatedRequirements.length} related requirement documents. Ensure implementation meets all specified criteria.`,
            priority: 'high'
          });
        }
      }
    }

    return optimizations;
  }

  async analyzeDocumentation(projectPath) {
    const documentPath = path.join(projectPath, '.document');
    const documentation = {
      hasDocuments: false,
      documents: [],
      requirements: [],
      architecture: [],
      apis: []
    };

    try {
      if (await fs.pathExists(documentPath)) {
        documentation.hasDocuments = true;
        const files = await fs.readdir(documentPath, { withFileTypes: true });
        
        for (const file of files) {
          if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
            const filePath = path.join(documentPath, file.name);
            const content = await fs.readFile(filePath, 'utf-8');
            
            const docInfo = {
              name: file.name,
              type: this.categorizeDocument(file.name, content),
              content: content.substring(0, 1000), // 限制内容长度
              fullContent: content
            };

            documentation.documents.push(docInfo);
            
            // 根据文档类型分类
            if (docInfo.type === 'requirements') {
              documentation.requirements.push(docInfo);
            } else if (docInfo.type === 'architecture') {
              documentation.architecture.push(docInfo);
            } else if (docInfo.type === 'api') {
              documentation.apis.push(docInfo);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`${chalk.yellow('Warning:')} Failed to analyze documentation: ${error.message}`);
    }

    return documentation;
  }

  categorizeDocument(filename, content) {
    const lowerName = filename.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (lowerName.includes('require') || lowerName.includes('需求') || 
        lowerContent.includes('requirement') || lowerContent.includes('需求')) {
      return 'requirements';
    }
    
    if (lowerName.includes('arch') || lowerName.includes('设计') || 
        lowerContent.includes('architecture') || lowerContent.includes('design')) {
      return 'architecture';
    }
    
    if (lowerName.includes('api') || lowerContent.includes('endpoint') || 
        lowerContent.includes('接口')) {
      return 'api';
    }
    
    return 'general';
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
      '.vue': 'vue', '.py': 'python', '.java': 'java', '.css': 'stylesheet',
      '.html': 'markup', '.json': 'data', '.md': 'documentation'
    };
    return typeMap[ext] || 'other';
  }
} 