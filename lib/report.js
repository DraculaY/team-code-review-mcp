import fs from 'fs-extra';
import path from 'path';

export class ReportGenerator {
  async generateReport(analysisResults, options = {}) {
    const {
      outputPath = './team-analysis-reports',
      format = 'html',
      includeRiskAnalysis = true,
      includeOptimizationSuggestions = true
    } = options;

    await fs.ensureDir(outputPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `team-analysis-${timestamp}`;

    switch (format) {
      case 'html':
        return await this.generateHTMLReport(analysisResults, outputPath, filename, options);
      case 'markdown':
        return await this.generateMarkdownReport(analysisResults, outputPath, filename, options);
      case 'json':
        return await this.generateJSONReport(analysisResults, outputPath, filename, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async generateHTMLReport(analysisResults, outputPath, filename, options) {
    const htmlContent = this.generateHTMLContent(analysisResults, options);
    const filePath = path.join(outputPath, `${filename}.html`);
    await fs.writeFile(filePath, htmlContent);
    return filePath;
  }

  async generateMarkdownReport(analysisResults, outputPath, filename, options) {
    const markdownContent = this.generateMarkdownContent(analysisResults, options);
    const filePath = path.join(outputPath, `${filename}.md`);
    await fs.writeFile(filePath, markdownContent);
    return filePath;
  }

  async generateJSONReport(analysisResults, outputPath, filename, options) {
    const filePath = path.join(outputPath, `${filename}.json`);
    await fs.writeJson(filePath, analysisResults, { spaces: 2 });
    return filePath;
  }

  generateHTMLContent(results, options) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Code Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; border-bottom: 1px solid #eee; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 0.9em; text-transform: uppercase; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #333; }
        .projects { padding: 30px; }
        .project { margin-bottom: 30px; border: 1px solid #e1e4e8; border-radius: 6px; overflow: hidden; }
        .project-header { background: #f6f8fa; padding: 20px; border-bottom: 1px solid #e1e4e8; }
        .project-header h3 { margin: 0; color: #333; }
        .project-content { padding: 20px; }
        .risk-high { color: #d73a49; }
        .risk-medium { color: #f66a0a; }
        .risk-low { color: #28a745; }
        .changes-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .changes-table th, .changes-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e4e8; }
        .changes-table th { background: #f6f8fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Team Code Analysis Report</h1>
            <p>Generated on ${new Date(results.analysisDate).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Projects</h3>
                <div class="value">${results.projects.length}</div>
            </div>
            <div class="summary-card">
                <h3>Total Changes</h3>
                <div class="value">${results.totalChanges}</div>
            </div>
            <div class="summary-card">
                <h3>Total Risks</h3>
                <div class="value risk-${results.totalRisks > 10 ? 'high' : results.totalRisks > 5 ? 'medium' : 'low'}">${results.totalRisks}</div>
            </div>
        </div>

        <div class="projects">
            ${results.projects.map(project => this.generateProjectHTML(project, options)).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  generateProjectHTML(project, options) {
    const statusColor = project.status === 'success' ? 'risk-low' : 'risk-high';
    
    return `
        <div class="project">
            <div class="project-header">
                <h3>${project.project} <span class="${statusColor}">(${project.status})</span></h3>
                <p>📁 ${project.path}</p>
                <p>🔀 ${project.branches.base} → ${project.branches.target}</p>
            </div>
            <div class="project-content">
                ${project.status === 'success' ? `
                    <div class="analysis-summary">
                        <strong>Analysis:</strong> 
                        ${project.analysis.filesChanged} files changed, 
                        ${project.analysis.linesAdded} additions (+), 
                        ${project.analysis.linesDeleted} deletions (-)
                    </div>

                    ${project.changes.length > 0 ? `
                        <table class="changes-table">
                            <thead>
                                <tr><th>File</th><th>Type</th><th>Changes</th><th>Risk Level</th></tr>
                            </thead>
                            <tbody>
                                ${project.changes.slice(0, 10).map(change => `
                                    <tr>
                                        <td>${change.file}</td>
                                        <td>${change.type}</td>
                                        <td>+${change.additions} -${change.deletions}</td>
                                        <td class="risk-${change.riskLevel}">${change.riskLevel}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No changes detected.</p>'}
                ` : `<p class="risk-high">Error: ${project.error || 'Unknown error'}</p>`}
            </div>
        </div>
    `;
  }

  generateMarkdownContent(results, options) {
    return `# 📊 Team Code Analysis Report

Generated on ${new Date(results.analysisDate).toLocaleString()}

## Summary

- **Total Projects:** ${results.projects.length}
- **Total Changes:** ${results.totalChanges}
- **Total Risks:** ${results.totalRisks}

## Projects Analysis

${results.projects.map(project => this.generateProjectMarkdown(project, options)).join('\n\n---\n\n')}
`;
  }

  generateProjectMarkdown(project, options) {
    return `### ${project.project} (${project.status})

**Path:** \`${project.path}\`  
**Branches:** ${project.branches.base} → ${project.branches.target}

${project.status === 'success' ? `
**Analysis:** ${project.analysis.filesChanged} files changed, ${project.analysis.linesAdded} additions (+), ${project.analysis.linesDeleted} deletions (-)

#### Changes
${project.changes.length > 0 ? 
  project.changes.slice(0, 10).map(change => 
    `- \`${change.file}\` (${change.type}): +${change.additions} -${change.deletions} [${change.riskLevel} risk]`
  ).join('\n') : 'No changes detected.'
}` : `**Error:** ${project.error || 'Unknown error'}`}`;
  }
} 