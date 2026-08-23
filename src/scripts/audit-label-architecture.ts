import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {datasetDirForSpec, datasetOutDir} from '../lib/dataset-paths.ts';
import {readDatasetManifest} from '../lib/dataset-manifest.ts';
import {
    buildLabelArchitectureAudit,
    formatLabelArchitectureAudit
} from '../lib/label-architecture-audit.ts';
import {
    loadGeneratorModelCatalog,
    loadViewModelCatalog
} from '../lib/model-catalog.ts';
import {loadMatchingTargets} from '../lib/spec-validator.ts';
import {createWorkCounters} from '../lib/work-counters.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');
    if (!specName) {
        throw new Error(
            'The --spec parameter is required. Usage: npm run audit:label-architecture -- --spec=ccss'
        );
    }
    const outputDir = resolve(
        PROJECT_ROOT,
        getCliOption(args, 'output-dir') ?? `temp/label-architecture/${specName}`
    );
    const strict = args.includes('--strict');
    const datasetDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName));
    const manifest = readDatasetManifest(datasetDir);
    const counters = createWorkCounters();
    const [targets, generators, views] = await Promise.all([
        loadMatchingTargets(specName),
        loadGeneratorModelCatalog(undefined, counters),
        loadViewModelCatalog(undefined, counters)
    ]);
    const report = buildLabelArchitectureAudit({
        projectRoot: PROJECT_ROOT,
        specName,
        targets,
        generators,
        views,
        graph: manifest?.spec === specName ? manifest.dependency_graph : null,
        counters
    });
    const jsonPath = resolve(outputDir, 'audit.json');
    const markdownPath = resolve(outputDir, 'audit.md');
    mkdirSync(outputDir, {recursive: true});
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(markdownPath, formatLabelArchitectureAudit(report));

    const violations = report.findings.filter(finding => finding.disposition === 'violation');
    const reviews = report.findings.filter(finding => finding.disposition === 'review');
    const signals = report.findings.filter(finding => finding.disposition === 'signal');
    console.log('=== Label Architecture Audit ===');
    console.log(`Spec: ${specName}`);
    console.log(`Matching: ${report.matching.source} (${report.matching.graph_reuse_reason})`);
    console.log(
        `Targets: ${report.matching.targets}; compatible pairs: ${report.matching.compatible_pairs}; `
        + `matched tuples: ${report.matching.matched_tuples}`
    );
    console.log(
        `Findings: ${violations.length} violation(s), ${reviews.length} review item(s), `
        + `${signals.length} signal(s)`
    );
    console.log(`Markdown: ${markdownPath}`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`Work counters: ${JSON.stringify(report.work)}`);
    if (strict && violations.length > 0) {
        process.exitCode = 1;
        console.error('Strict label-architecture audit failed.');
    } else if (violations.length > 0) {
        console.log('Phase 0 report mode: violations are reported without failing. Add --strict to gate them.');
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
