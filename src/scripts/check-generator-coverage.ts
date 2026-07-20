import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve('.');
const COVERAGE_JSON_PATH = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json');

const STATEMENT_THRESHOLD = 85.0;
const BRANCH_THRESHOLD = 60.0;

function runCoverageCheck() {
    console.log('=== Initiating Code Coverage Validation ===\n');

    if (!fs.existsSync(COVERAGE_JSON_PATH)) {
        console.error(`❌ Error: Coverage summary JSON not found at ${COVERAGE_JSON_PATH}`);
        console.error('Please run "npm run test" or "vitest run --coverage" first.');
        process.exit(1);
    }

    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_JSON_PATH, 'utf-8'));
    
    let allPassed = true;
    const reportLines: string[] = [];

    reportLines.push('# Generator Code Coverage Report');
    reportLines.push('');
    reportLines.push('| Generator | Statement % | Branch % | Status |');
    reportLines.push('| :--- | :---: | :---: | :---: |');

    for (const [filePath, metrics] of Object.entries(coverageData) as [string, any][]) {
        if (filePath === 'total') continue;

        // Extract relative file path for clean formatting
        const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
        
        const stmtPct = metrics.statements.pct;
        const branchPct = metrics.branches.pct;

        const stmtPassed = stmtPct >= STATEMENT_THRESHOLD;
        const branchPassed = branchPct >= BRANCH_THRESHOLD;
        const passed = stmtPassed && branchPassed;

        if (!passed) {
            allPassed = false;
        }

        const statusLabel = passed ? '✅ PASS' : '❌ FAIL';
        reportLines.push(`| [${relativePath}](${relativePath}) | ${stmtPct}% | ${branchPct}% | ${statusLabel} |`);
    }

    reportLines.push('');
    reportLines.push(`*Thresholds: Statements >= ${STATEMENT_THRESHOLD}%, Branches >= ${BRANCH_THRESHOLD}%*`);

    const reportContent = reportLines.join('\n');
    console.log(reportContent);

    // Save report as a local artifact markdown file so the user can easily click/view it
    const artifactPath = path.join(PROJECT_ROOT, 'coverage', 'generator-coverage-report.md');
    fs.writeFileSync(artifactPath, reportContent, 'utf-8');
    const relativeArtifactPath = path.relative(PROJECT_ROOT, artifactPath).replace(/\\/g, '/');
    console.log(`\nReport saved to: ${relativeArtifactPath}\n`);

    if (!allPassed) {
        console.error('❌ Code coverage check failed. Some files do not meet the minimum thresholds.');
        process.exit(1);
    } else {
        console.log('✅ All checked files passed minimum coverage thresholds!');
        process.exit(0);
    }
}

runCoverageCheck();
