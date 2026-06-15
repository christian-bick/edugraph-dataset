import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset');

interface MetaEntry {
    tags: string[];
    [key: string]: any;
}

function generateReport() {
    if (!existsSync(OUT_DIR)) {
        console.error(`Error: Output directory not found at ${OUT_DIR}`);
        return;
    }

    const labelCounts: Record<string, number> = {};
    const combinationCounts: Record<string, number> = {};
    let totalEntries = 0;

    const splits = ['train', 'val'];
    const modules = readdirSync(join(OUT_DIR, 'train'), { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    console.log(`Analyzing dataset across modules: ${modules.join(', ')}...\n`);

    for (const split of splits) {
        for (const module of modules) {
            const metaPath = join(OUT_DIR, split, module, 'metadata.jsonl');
            if (existsSync(metaPath)) {
                const fileContent = readFileSync(metaPath, 'utf8');
                const lines = fileContent.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    const entry: MetaEntry = JSON.parse(line);
                    totalEntries++;
                    
                    // Independent Label Counts
                    for (const label of entry.tags) {
                        labelCounts[label] = (labelCounts[label] || 0) + 1;
                    }

                    // Combination Counts (sorted to ensure uniqueness)
                    const combo = [...entry.tags].sort().join(' | ');
                    combinationCounts[combo] = (combinationCounts[combo] || 0) + 1;
                }
            }
        }
    }

    // --- Output Generation ---
    let report = `# Dataset Coverage Report\n\n`;
    report += `**Total Generated Items:** ${totalEntries}\n\n`;

    report += `## 1. Independent Label Frequency\n`;
    report += `| Label | Count | Percentage |\n`;
    report += `| :--- | :--- | :--- |\n`;
    const sortedLabels = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);
    for (const [label, count] of sortedLabels) {
        const percentage = ((count / totalEntries) * 100).toFixed(2);
        report += `| ${label} | ${count} | ${percentage}% |\n`;
    }

    report += `\n## 2. Label Combination Frequency\n`;
    report += `| Combination | Count | Percentage |\n`;
    report += `| :--- | :--- | :--- |\n`;
    const sortedCombos = Object.entries(combinationCounts).sort((a, b) => b[1] - a[1]);
    for (const [combo, count] of sortedCombos) {
        const percentage = ((count / totalEntries) * 100).toFixed(2);
        const cleanCombo = combo.replace(/http:\/\/edugraph\.io\/edu#/g, '');
        report += `| ${cleanCombo} | ${count} | ${percentage}% |\n`;
    }

    const reportPath = resolve(OUT_DIR, 'coverage-report.md');
    writeFileSync(reportPath, report);
    console.log(`Report generated successfully at ${reportPath}`);
    
    // Print summary to console
    console.log(`\nSummary:`);
    console.log(`- Total Items: ${totalEntries}`);
    console.log(`- Unique Labels Found: ${Object.keys(labelCounts).length}`);
    console.log(`- Unique Combinations Found: ${Object.keys(combinationCounts).length}`);
}

generateReport();
