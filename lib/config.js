import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

export class ConfigManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.team-code-review-config.json');
    this.projects = [];
  }

  async setupProjects(mode = 'env', customConfigPath = null) {
    switch (mode) {
      case 'env':
        return await this.setupFromEnvironment();
      case 'file':
        return await this.setupFromFile(customConfigPath);
      default:
        throw new Error(`Unknown setup mode: ${mode}`);
    }
  }

  async setupFromEnvironment() {
    const envProjects = process.env.TEAM_PROJECTS || process.env.PROJECTS || '';
    const envBaseBranch = process.env.TEAM_BASE_BRANCH || process.env.BASE_BRANCH || 'main';
    const envTargetBranch = process.env.TEAM_TARGET_BRANCH || process.env.TARGET_BRANCH || 'develop';

    if (!envProjects) {
      throw new Error('No projects configured in environment variables. Set TEAM_PROJECTS="name1:path1:base1:target1|name2:path2:base2:target2"');
    }

    const projects = [];
    const projectEntries = envProjects.split('|').filter(entry => entry.trim());

    for (const entry of projectEntries) {
      const parts = entry.split(':');
      if (parts.length < 2) {
        console.warn(`${chalk.yellow('Warning:')} Invalid project entry: ${entry}. Skipping.`);
        continue;
      }

      const [name, projectPath, baseBranch = envBaseBranch, targetBranch = envTargetBranch] = parts;
      
      const fullPath = path.resolve(projectPath.trim());
      if (!await fs.pathExists(fullPath)) {
        console.warn(`${chalk.yellow('Warning:')} Project path not found: ${fullPath}. Skipping ${name}.`);
        continue;
      }

      projects.push({
        name: name.trim(),
        path: fullPath,
        baseBranch: baseBranch.trim(),
        targetBranch: targetBranch.trim()
      });
    }

    if (projects.length === 0) {
      throw new Error('No valid projects found in environment configuration');
    }

    this.projects = projects;
    await this.saveConfiguration();

    return {
      message: `Successfully configured ${projects.length} projects from environment variables`,
      projects
    };
  }

  async setupFromFile(configPath) {
    const filePath = configPath || this.configPath;
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    try {
      const config = await fs.readJson(filePath);
      const projects = config.projects || [];

      const validProjects = [];
      for (const project of projects) {
        if (!project.name || !project.path) {
          console.warn(`${chalk.yellow('Warning:')} Invalid project configuration: ${JSON.stringify(project)}. Skipping.`);
          continue;
        }

        const fullPath = path.resolve(project.path);
        if (!await fs.pathExists(fullPath)) {
          console.warn(`${chalk.yellow('Warning:')} Project path not found: ${fullPath}. Skipping ${project.name}.`);
          continue;
        }

        validProjects.push({
          name: project.name,
          path: fullPath,
          baseBranch: project.baseBranch || 'main',
          targetBranch: project.targetBranch || 'develop'
        });
      }

      this.projects = validProjects;
      await this.saveConfiguration();

      return {
        message: `Successfully loaded ${validProjects.length} projects from configuration file`,
        projects: validProjects
      };
    } catch (error) {
      throw new Error(`Failed to parse configuration file: ${error.message}`);
    }
  }

  async addProject(project) {
    const { name, path: projectPath, baseBranch = 'main', targetBranch = 'develop' } = project;
    
    const fullPath = path.resolve(projectPath);
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Project path not found: ${fullPath}`);
    }

    const existingIndex = this.projects.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      this.projects[existingIndex] = { name, path: fullPath, baseBranch, targetBranch };
    } else {
      this.projects.push({ name, path: fullPath, baseBranch, targetBranch });
    }

    await this.saveConfiguration();
  }

  async removeProject(name) {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(p => p.name !== name);
    
    if (this.projects.length === initialLength) {
      throw new Error(`Project not found: ${name}`);
    }

    await this.saveConfiguration();
  }

  async getProjects() {
    if (this.projects.length === 0) {
      await this.loadConfiguration();
    }
    return this.projects;
  }

  async validateConfiguration(showDetails = true) {
    const projects = await this.getProjects();
    const issues = [];
    const validProjects = [];

    for (const project of projects) {
      const projectIssues = [];
      
      if (!await fs.pathExists(project.path)) {
        projectIssues.push(`Path not found: ${project.path}`);
      } else {
        const gitPath = path.join(project.path, '.git');
        if (!await fs.pathExists(gitPath)) {
          projectIssues.push('Not a Git repository');
        }
      }

      if (projectIssues.length > 0) {
        issues.push({
          project: project.name,
          issues: projectIssues
        });
      } else {
        validProjects.push(project);
      }
    }

    const isValid = issues.length === 0;
    let message = `Validation completed. ${validProjects.length}/${projects.length} projects are valid.`;

    if (showDetails && issues.length > 0) {
      message += '\n\nIssues found:\n' + issues.map(issue => 
        `- ${issue.project}: ${issue.issues.join(', ')}`
      ).join('\n');
    }

    return {
      isValid,
      message,
      validProjects,
      issues
    };
  }

  async loadConfiguration() {
    if (await fs.pathExists(this.configPath)) {
      try {
        const config = await fs.readJson(this.configPath);
        this.projects = config.projects || [];
      } catch (error) {
        console.warn(`${chalk.yellow('Warning:')} Failed to load configuration: ${error.message}`);
        this.projects = [];
      }
    }
  }

  async saveConfiguration() {
    const config = {
      projects: this.projects,
      lastUpdated: new Date().toISOString()
    };

    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }
} 