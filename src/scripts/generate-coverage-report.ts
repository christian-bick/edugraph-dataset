import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getCliOption } from '../lib/cli.ts';
import { datasetOutDir, isUnionSpec, resolveDatasetDir } from '../lib/dataset-paths.ts';
import {readDatasetSnapshot} from '../lib/dataset-store.ts';
import {radixSortUtf8} from '../lib/content-identity.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const specName = getCliOption(args, 'spec');
if (!specName) {
    console.error('❌ Error: The --spec parameter is required.');
    console.error('Usage: npm run report:coverage -- --spec=<spec_module>');
    console.error('Pass --spec=union for the merged dataset across all standards.');
    process.exit(1);
}
const selectedSpec = specName;

// A standard's own coverage, or --spec=union for the released dataset's.
const OUT_DIR = datasetOutDir(PROJECT_ROOT, resolveDatasetDir(selectedSpec));

interface MetaEntry {
    file_name: string;
    tags: string[];
    [key: string]: any;
}

function readPublishedUnionEntries(datasetDir: string): MetaEntry[] {
    return ['train', 'validation'].flatMap(split => {
        const path = resolve(datasetDir, split, 'metadata.jsonl');
        if (!existsSync(path)) return [];
        return readFileSync(path, 'utf-8')
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line) as MetaEntry);
    });
}

function descendingFrequency(
    counts: Readonly<Record<string, number>>,
    maximum: number
): Array<[string, number]> {
    const buckets: string[][] = Array.from({length: maximum + 1}, () => []);
    for (const key of radixSortUtf8(Object.keys(counts))) buckets[counts[key]].push(key);
    const ordered: Array<[string, number]> = [];
    for (let count = maximum; count >= 0; count--) {
        for (const key of buckets[count]) ordered.push([key, count]);
    }
    return ordered;
}

function generateReport() {
    if (!existsSync(OUT_DIR)) {
        console.error(`Error: Output directory not found at ${OUT_DIR}`);
        return;
    }

    const labelCounts: Record<string, number> = {};
    const combinationCounts: Record<string, number> = {};
    let totalEntries = 0;

    const entries = isUnionSpec(selectedSpec)
        ? readPublishedUnionEntries(OUT_DIR)
        : (() => {
            const snapshot = readDatasetSnapshot(OUT_DIR);
            return [...snapshot.rows('train'), ...snapshot.rows('val')] as unknown as MetaEntry[];
        })();
    const modules = radixSortUtf8([...new Set(entries.map(entry =>
        typeof entry.generator === 'string'
            ? entry.generator
            : String(entry.file_name).split('/')[0]))]);

    console.log(`Analyzing dataset across modules: ${modules.join(', ')}...\n`);

    for (const entry of entries) {
        totalEntries++;

        // Independent Label Counts
        for (const label of entry.tags) {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        }

        // Combination Counts (sorted to ensure uniqueness)
        const combo = radixSortUtf8(entry.tags).join(' | ');
        combinationCounts[combo] = (combinationCounts[combo] || 0) + 1;
    }

    // --- Output Generation ---
    let report = `# Dataset Coverage Report\n\n`;
    report += `**Total Generated Items:** ${totalEntries}\n\n`;

    report += `## 1. Independent Label Frequency\n`;
    report += `| Label | Count | Percentage |\n`;
    report += `| :--- | :--- | :--- |\n`;
    const sortedLabels = descendingFrequency(labelCounts, totalEntries);
    for (const [label, count] of sortedLabels) {
        const percentage = ((count / totalEntries) * 100).toFixed(2);
        const cleanLabel = label.replace(/http:\/\/edugraph\.io\/edu[\/#]/g, '');
        report += `| ${cleanLabel} | ${count} | ${percentage}% |\n`;
    }

    report += `\n## 2. Label Combination Frequency\n`;
    report += `| Combination | Count | Percentage |\n`;
    report += `| :--- | :--- | :--- |\n`;
    const sortedCombos = descendingFrequency(combinationCounts, totalEntries);
    for (const [combo, count] of sortedCombos) {
        const percentage = ((count / totalEntries) * 100).toFixed(2);
        // Remove the URI prefix and replace the pipe separator with something that doesn't break the Markdown table
        const cleanCombo = combo
            .replace(/http:\/\/edugraph\.io\/edu[\/#]/g, '')
            .replace(/ \| /g, ', ');
        report += `| ${cleanCombo} | ${count} | ${percentage}% |\n`;
    }

    const reportPath = isUnionSpec(selectedSpec)
        ? resolve(OUT_DIR, 'coverage-report.md')
        : resolve(PROJECT_ROOT, 'out', 'reports', basename(OUT_DIR), 'coverage-report.md');
    mkdirSync(dirname(reportPath), {recursive: true});
    writeFileSync(reportPath, report);
    console.log(`Report generated successfully at ${reportPath}`);
    
    // Print summary to console
    console.log(`\nSummary:`);
    console.log(`- Total Items: ${totalEntries}`);
    console.log(`- Unique Labels Found: ${Object.keys(labelCounts).length}`);
    console.log(`- Unique Combinations Found: ${Object.keys(combinationCounts).length}`);
}

generateReport();
