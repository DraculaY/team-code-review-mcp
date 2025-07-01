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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        
        .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .summary-card { background: white; padding: 20px; border-radius: 10px; text-align: center; flex: 1; min-width: 200px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 0.9em; text-transform: uppercase; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #333; }
        
        .project-card { background: white; margin-bottom: 30px; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .project-card h3 { background: #667eea; color: white; margin: 0; padding: 20px; font-size: 1.3em; }
        .project-info { padding: 20px; border-bottom: 1px solid #eee; }
        .project-info p { margin: 5px 0; color: #666; }
        
        .documentation-section { padding: 20px; border-bottom: 1px solid #eee; background: #f8f9ff; }
        .documentation-section h4 { margin: 0 0 15px 0; color: #667eea; }
        .doc-summary { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .doc-count { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .doc-type { background: #e3f2fd; color: #1976d2; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .documents-list { max-height: 300px; overflow-y: auto; }
        .document-item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #667eea; }
        .document-item strong { color: #667eea; }
        .doc-preview { margin: 8px 0 0 0; color: #666; font-size: 0.9em; line-height: 1.4; }
        
        .analysis { display: flex; gap: 20px; padding: 20px; background: #f8f9fa; }
        .metric { text-align: center; flex: 1; }
        .metric .label { display: block; color: #666; font-size: 0.9em; margin-bottom: 5px; }
        .metric .value { font-size: 1.5em; font-weight: bold; color: #333; }
        
        .risks { padding: 20px; background: #fff5f5; }
        .risks h4 { margin: 0 0 15px 0; color: #dc2626; }
        .risk { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #dc2626; }
        .risk-high { border-left-color: #dc2626; }
        .risk-medium { border-left-color: #f59e0b; }
        .risk-low { border-left-color: #10b981; }
        .file-path { color: #666; font-size: 0.9em; margin-top: 5px; font-family: monospace; }
        .context-info { background: #f3f4f6; padding: 10px; margin-top: 10px; border-radius: 5px; font-size: 0.9em; color: #374151; }
        
        .optimizations { padding: 20px; background: #f0fdf4; }
        .optimizations h4 { margin: 0 0 15px 0; color: #059669; }
        .optimization { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #059669; }
        .priority-high { border-left-color: #dc2626; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
        .reasoning { background: #f3f4f6; padding: 10px; margin-top: 10px; border-radius: 5px; font-size: 0.9em; color: #374151; }
        
        .risk-low { color: #059669; }
        .risk-medium { color: #f59e0b; }
        .risk-high { color: #dc2626; }
        
        @media (max-width: 768px) {
            .summary { flex-direction: column; }
            .analysis { flex-direction: column; gap: 10px; }
            .doc-summary { flex-direction: column; align-items: flex-start; }
        }
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
    
    // 生成文档分析部分
    const documentationSection = project.documentation && project.documentation.hasDocuments ? `
        <div class="documentation-section">
            <h4>📄 Documentation Analysis</h4>
            <div class="doc-summary">
                <span class="doc-count">${project.documentation.documents.length} documents found</span>
                ${project.documentation.requirements.length > 0 ? `<span class="doc-type">Requirements: ${project.documentation.requirements.length}</span>` : ''}
                ${project.documentation.architecture.length > 0 ? `<span class="doc-type">Architecture: ${project.documentation.architecture.length}</span>` : ''}
                ${project.documentation.apis.length > 0 ? `<span class="doc-type">APIs: ${project.documentation.apis.length}</span>` : ''}
            </div>
            <div class="documents-list">
                ${project.documentation.documents.map(doc => `
                    <div class="document-item">
                        <strong>${doc.name}</strong> (${doc.type})
                        <p class="doc-preview">${doc.content}${doc.content.length >= 1000 ? '...' : ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '<div class="documentation-section"><p>No .document folder found</p></div>';

    return `
        <div class="project-card ${statusColor}">
            <h3>${project.project}</h3>
            <div class="project-info">
                <p><strong>Path:</strong> ${project.path}</p>
                <p><strong>Branches:</strong> ${project.branches.base} → ${project.branches.target}</p>
                <p><strong>Status:</strong> ${project.status}</p>
            </div>
            
            ${documentationSection}
            
            <div class="analysis">
                <div class="metric">
                    <span class="label">Files Changed:</span>
                    <span class="value">${project.analysis.filesChanged}</span>
                </div>
                <div class="metric">
                    <span class="label">Lines Added:</span>
                    <span class="value">${project.analysis.linesAdded}</span>
                </div>
                <div class="metric">
                    <span class="label">Lines Deleted:</span>
                    <span class="value">${project.analysis.linesDeleted}</span>
                </div>
            </div>

            ${options.includeRiskAnalysis && project.risks.total > 0 ? `
            <div class="risks">
                <h4>⚠️ Risks Identified (${project.risks.total})</h4>
                ${project.risks.security.map(risk => `
                    <div class="risk risk-${risk.severity}">
                        <strong>[${risk.type}]</strong> ${risk.message}
                        <div class="file-path">${risk.file}</div>
                        ${risk.contextInfo ? `<div class="context-info">${risk.contextInfo}</div>` : ''}
                    </div>
                `).join('')}
                ${project.risks.performance.map(risk => `
                    <div class="risk risk-${risk.severity}">
                        <strong>[${risk.type}]</strong> ${risk.message}
                        <div class="file-path">${risk.file}</div>
                        ${risk.contextInfo ? `<div class="context-info">${risk.contextInfo}</div>` : ''}
                    </div>
                `).join('')}
                ${project.risks.codeQuality.map(risk => `
                    <div class="risk risk-${risk.severity}">
                        <strong>[${risk.type}]</strong> ${risk.message}
                        <div class="file-path">${risk.file}</div>
                        ${risk.contextInfo ? `<div class="context-info">${risk.contextInfo}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${options.includeOptimizationSuggestions && project.optimizations.length > 0 ? `
            <div class="optimizations">
                <h4>💡 Optimization Suggestions (${project.optimizations.length})</h4>
                ${project.optimizations.map(opt => `
                    <div class="optimization priority-${opt.priority}">
                        <strong>[${opt.type}]</strong> ${opt.suggestion}
                        <div class="file-path">${opt.file}</div>
                        ${opt.reasoning ? `<div class="reasoning">${opt.reasoning}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}
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