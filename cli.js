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
  .version('1.1.0');

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

// Quick analysis command - one-click for team members
program
  .command('quick')
  .alias('q')
  .description('🚀 Quick one-click analysis for all configured projects')
  .option('-m, --message <message>', 'Analysis message or focus area', 'Team quick analysis')
  .action(async (options) => {
    const spinner = ora('🚀 Running quick team analysis...').start();
    
    try {
      // Try to auto-setup if no projects configured
      let projects = await configManager.getProjects();
      
      if (projects.length === 0) {
        spinner.text = 'No projects found, trying auto-setup from environment...';
        try {
          await configManager.setupProjects('env');
          projects = await configManager.getProjects();
        } catch (setupError) {
          spinner.fail('Quick analysis failed');
          console.error(`${chalk.red('Error:')} No projects configured and auto-setup failed.`);
          console.error(`${chalk.yellow('Solution:')} Set TEAM_PROJECTS environment variable or run 'team-code-review setup'`);
          console.error(`${chalk.gray('Example:')} export TEAM_PROJECTS="frontend:/path/to/frontend:main:develop|backend:/path/to/backend:main:develop"`);
          process.exit(1);
        }
      }

      if (projects.length === 0) {
        spinner.fail('No projects available');
        console.error(`${chalk.red('Error:')} No valid projects found for analysis.`);
        process.exit(1);
      }

      spinner.text = `Analyzing ${projects.length} projects...`;
      
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

      spinner.succeed('🎉 Quick analysis completed');
      
      console.log(`\n${chalk.green.bold('📊 Team Analysis Report Generated!')}\n`);
      console.log(`${chalk.cyan('Message:')} ${options.message}`);
      console.log(`${chalk.cyan('Report:')} ${reportPath}`);
      console.log(`${chalk.cyan('Projects:')} ${projects.length} analyzed\n`);
      
      // Enhanced summary with documentation info
      console.log(chalk.bold('Quick Summary:'));
      analysisResults.summary.forEach(s => {
        const statusIcon = s.status === 'success' ? '✅' : '❌';
        const riskColor = s.risks > 5 ? chalk.red : s.risks > 2 ? chalk.yellow : chalk.green;
        const project = analysisResults.projects.find(p => p.project === s.project);
        const docInfo = project && project.documentation && project.documentation.hasDocuments ? 
          ` (📄 ${project.documentation.documents.length} docs)` : '';
        
        console.log(`  ${statusIcon} ${chalk.cyan(s.project)}${docInfo}: ${s.changes} changes, ${riskColor(s.risks)} risks`);
      });
      
      console.log(`\n${chalk.gray('💡 Tip: Open the HTML report in your browser for detailed analysis with documentation insights!')}`);
      
    } catch (error) {
      spinner.fail('Quick analysis failed');
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