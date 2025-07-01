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

      let risks = { security: [], performance: [], codeQuality: [], total: 0 };
      if (includeRiskAnalysis) {
        risks = await this.analyzeRisks(changes);
      }

      let optimizations = [];
      if (includeOptimizationSuggestions) {
        optimizations = await this.generateOptimizations(changes);
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

  async analyzeRisks(changes) {
    const risks = { security: [], performance: [], codeQuality: [], total: 0 };

    for (const change of changes) {
      if (change.file.includes('auth') || change.file.includes('login')) {
        risks.security.push({
          file: change.file,
          type: 'authentication',
          message: 'Authentication related changes detected',
          severity: 'high'
        });
      }

      if (change.changes > 100) {
        risks.performance.push({
          file: change.file,
          type: 'large-change',
          message: `Large changes (${change.changes} lines) may affect performance`,
          severity: 'medium'
        });
      }

      if (change.file.includes('test') && change.deletions > change.additions) {
        risks.codeQuality.push({
          file: change.file,
          type: 'test-reduction',
          message: 'Test code reduction detected',
          severity: 'high'
        });
      }
    }

    risks.total = risks.security.length + risks.performance.length + risks.codeQuality.length;
    return risks;
  }

  async generateOptimizations(changes) {
    const optimizations = [];

    for (const change of changes) {
      if (this.getFileType(change.file) === 'javascript') {
        optimizations.push({
          file: change.file,
          type: 'code-quality',
          suggestion: 'Consider using modern ES6+ features',
          priority: 'medium'
        });
      }

      if (change.file.includes('component') && change.changes > 50) {
        optimizations.push({
          file: change.file,
          type: 'architecture',
          suggestion: 'Consider breaking large components into smaller ones',
          priority: 'high'
        });
      }
    }

    return optimizations;
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