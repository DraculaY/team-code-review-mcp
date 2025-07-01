#!/usr/bin/env node

import { program } from 'commander';
import { ConfigManager } from './lib/config.js';
import { TeamCodeAnalyzer } from './lib/analyzer.js';
import { ReportGenerator } from './lib/report.js';
import chalk from 'chalk';
import ora from 'ora';

// Initialize components
const configManager = new ConfigManager();
const analyzer = new TeamCodeAnalyzer();
const reportGenerator = new ReportGenerator();

program
  .name('team-code-review')
  .description('Team code review and analysis tool')
  .version('1.0.0');

// Setup command
program
  .command('setup')
  .description('Setup team projects configuration')
  .option('-m, --mode <mode>', 'Configuration mode (env|file)', 'env')
  .option('-c, --config <path>', 'Configuration file path', './team-projects-config.json')
  .action(async (options) => {
    const spinner = ora('Setting up team projects...').start();
    
    try {
      const result = await configManager.setupProjects(options.mode, options.config);
      spinner.succeed('Team projects setup completed');
      
      console.log(`\n${chalk.green('✅ ' + result.message)}\n`);
      console.log('Configured projects:');
      result.projects.forEach(p => {
        console.log(`  ${chalk.cyan(p.name)}: ${p.path} (${p.baseBranch} → ${p.targetBranch})`);
      });
    } catch (error) {
      spinner.fail('Setup failed');
      console.error(`${chalk.red('Error:')} ${error.message}`);
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze team projects and generate reports')
  .option('-o, --output <path>', 'Output directory', './team-analysis-reports')
  .option('-f, --format <format>', 'Report format (html|markdown|json)', 'html')
  .option('--include-risks', 'Include risk analysis', true)
  .option('--include-optimizations', 'Include optimization suggestions', true)
  .action(async (options) => {
    const spinner = ora('Analyzing team projects...').start();
    
    try {
      const projects = await configManager.getProjects();
      
      if (projects.length === 0) {
        spinner.fail('No projects configured');
        console.error(`${chalk.red('Error:')} No projects configured. Run 'team-code-review setup' first.`);
        process.exit(1);
      }

      const analysisResults = await analyzer.analyzeMultipleProjects(projects, {
        includeRiskAnalysis: options.includeRisks,
        includeOptimizationSuggestions: options.includeOptimizations
      });

      const reportPath = await reportGenerator.generateReport(analysisResults, {
        outputPath: options.output,
        format: options.format,
        includeRiskAnalysis: options.includeRisks,
        includeOptimizationSuggestions: options.includeOptimizations
      });

      spinner.succeed('Analysis completed');
      
      console.log(`\n${chalk.green('📊 Analysis completed successfully!')}\n`);
      console.log(`Report generated: ${chalk.cyan(reportPath)}\n`);
      
      // Show summary
      console.log('Summary:');
      analysisResults.summary.forEach(s => {
        const statusIcon = s.status === 'success' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${chalk.cyan(s.project)}: ${s.changes} changes, ${s.risks} risks`);
      });
      
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(`${chalk.red('Error:')} ${error.message}`);
      process.exit(1);
    }
  });

// List projects command
program
  .command('list')
  .description('List all configured projects')
  .action(async () => {
    const spinner = ora('Loading projects...').start();
    
    try {
      const projects = await configManager.getProjects();
      
      spinner.stop();
      
      if (projects.length === 0) {
        console.log(`${chalk.yellow('📋 No projects configured')}\n`);
        console.log('Use "team-code-review setup" to get started.');
        return;
      }

      console.log(`${chalk.green('📋 Configured Team Projects')}\n`);
      
      projects.forEach((p, index) => {
        console.log(`${index + 1}. ${chalk.cyan(p.name)}`);
        console.log(`   Path: ${p.path}`);
        console.log(`   Branches: ${p.baseBranch} → ${p.targetBranch}\n`);
      });
      
    } catch (error) {
      spinner.fail('Failed to list projects');
      console.error(`${chalk.red('Error:')} ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(); 