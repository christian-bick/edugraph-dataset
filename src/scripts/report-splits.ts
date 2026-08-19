import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getCliOption } from '../lib/cli.ts';
import { datasetOutDir, isUnionSpec, resolveDatasetDir } from '../lib/dataset-paths.ts';
import { parseMetadataLines } from '../lib/dataset-merge.ts';
import { DEFAULT_VAL_RATIO } from '../lib/generation.ts';
import { buildSplitIntegrityReport, SplitIntegrityReport } from '../lib/split-report.ts';

/**
 * Audits the train/validation split of a generated dataset: cross-split
 * mathematical-content leakage, within-split task redundancy, realized ratio,
 * and per-view/per-label validation coverage. Analysis lives in
 * `src/lib/split-report.ts`; this script is its CLI and formatting shell.
 *
 * Exits non-zero on leakage or redundancy — those make validation metrics wrong
 * rather than merely thin. Coverage gaps are reported as warnings, since a view
 * whose content space is too small to split is a legitimate outcome.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const MAX_LISTED = 12;

function readSplit(outDir: string, splitDirName: string) {
    const path = resolve(outDir, splitDirName, 'metadata.jsonl');
    return existsSync(path) ? parseMetadataLines(readFileSync(path, 'utf-8')) : [];
}

function listCapped(items: string[], render: (item: string) => string) {
    for (const item of items.slice(0, MAX_LISTED)) console.log(render(item));
    if (items.length > MAX_LISTED) console.log(`    … and ${items.length - MAX_LISTED} more`);
}

function print(report: SplitIntegrityReport) {
    const { allocation } = report;

    console.log(`Rows:        ${report.trainRows} train / ${report.valRows} validation`);
    console.log(`Val share:   ${(report.valShare * 100).toFixed(1)}% of rows (allocator targets ${(report.requestedRatio * 100).toFixed(0)}% of tuples)`);
    console.log(`Tuples:      ${allocation.tuples} matched, ${allocation.allocated} allocated to validation, ${allocation.realized} realized`);

    console.log(`\n--- Cross-split leakage ---`);
    if (report.leaks.length === 0) {
        console.log(`✅ No validation content appears in train.`);
    } else {
        console.error(`❌ ${report.leaks.length} validation row(s) show content already present in train:`);
        for (const leak of report.leaks.slice(0, MAX_LISTED)) {
            console.error(`    ${leak.sampleKey}`);
            console.error(`      content ${leak.fingerprint} in [${leak.view}] also in train exercise(s): ${leak.trainExercises.join(', ')}`);
        }
        if (report.leaks.length > MAX_LISTED) console.error(`    … and ${report.leaks.length - MAX_LISTED} more`);
    }

    console.log(`\n--- Within-split redundancy ---`);
    if (report.redundancy.length === 0) {
        console.log(`✅ No configured task is shown by two exercises of the same view.`);
    } else {
        console.error(`❌ ${report.redundancy.length} duplicated configured task(s):`);
        for (const dup of report.redundancy.slice(0, MAX_LISTED)) {
            console.error(`    [${dup.split}] ${dup.view} ${dup.fingerprint}: ${dup.exercises.join(', ')}`);
        }
        if (report.redundancy.length > MAX_LISTED) console.error(`    … and ${report.redundancy.length - MAX_LISTED} more`);
    }

    console.log(`\n--- Allocation realized ---`);
    if (allocation.unrealized.length === 0) {
        console.log(`✅ Every allocated tuple produced validation samples.`);
    } else {
        const share = allocation.allocated > 0 ? (allocation.unrealized.length / allocation.allocated) * 100 : 0;
        console.log(`⚠️ ${allocation.unrealized.length} of ${allocation.allocated} allocated tuples (${share.toFixed(0)}%) produced no validation sample.`);
        console.log(`   Either the generator found no content disjoint from train within its retry budget,`);
        console.log(`   or the dataset predates the current allocator — regenerate before reading into this.`);
        listCapped(allocation.unrealized, key => `    ${key}`);
    }

    console.log(`\n--- View coverage ---`);
    const uncoveredViews = report.viewCoverage.filter(v => v.valRows === 0);
    if (uncoveredViews.length === 0) {
        console.log(`✅ All ${report.viewCoverage.length} views carry validation samples.`);
    } else {
        console.log(`⚠️ ${uncoveredViews.length} of ${report.viewCoverage.length} views have no validation samples:`);
        listCapped(
            uncoveredViews.map(v => v.view),
            view => {
                const entry = uncoveredViews.find(v => v.view === view)!;
                const cause = entry.allocatedTuples === 0 ? 'no tuple allocated' : `${entry.allocatedTuples} allocated tuple(s) produced nothing`;
                return `    ${view} (${entry.trainRows} train rows, ${cause})`;
            }
        );
    }

    console.log(`\n--- Label coverage ---`);
    const uncoveredLabels = report.labelCoverage.filter(l => l.valRows === 0);
    if (uncoveredLabels.length === 0) {
        console.log(`✅ All ${report.labelCoverage.length} labels carry validation samples.`);
    } else {
        console.log(`⚠️ ${uncoveredLabels.length} of ${report.labelCoverage.length} labels have no validation samples:`);
        listCapped(
            uncoveredLabels.map(l => l.label),
            label => `    ${label} (${uncoveredLabels.find(l => l.label === label)!.trainRows} train rows)`
        );
    }
}

function main() {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');

    if (!specName) {
        console.error('❌ Error: The --spec parameter is required.');
        console.error('Usage: npm run report:splits -- --spec=<spec_module>');
        process.exit(1);
    }
    if (isUnionSpec(specName)) {
        console.error('❌ Error: the released union contains compact training metadata only.');
        console.error('Split integrity is audited on each source standard before it is merged.');
        process.exit(1);
    }

    const datasetFolderName = resolveDatasetDir(specName);
    const outDir = datasetOutDir(PROJECT_ROOT, datasetFolderName);

    console.log(`--- Split Integrity Report [${datasetFolderName}] ---\n`);

    const train = readSplit(outDir, 'train');
    const val = readSplit(outDir, 'validation');

    if (train.length === 0) {
        console.error(`❌ No train metadata found at ${outDir}/train/metadata.jsonl`);
        console.error(`Generate it first: npm run generate:dataset -- --spec=${specName}`);
        process.exit(1);
    }
    if (val.length === 0) {
        console.log(`ℹ️ No validation split present (generated with --training-only?). Nothing to audit.`);
        return;
    }

    const report = buildSplitIntegrityReport(train, val, DEFAULT_VAL_RATIO);
    print(report);

    console.log();
    if (report.hasErrors) {
        console.error(`❌ Split integrity FAILED: validation metrics computed on this split would be optimistic.`);
        process.exit(1);
    }
    console.log(`✅ Split integrity holds: validation content is disjoint from train and configured tasks are non-redundant.`);
}

main();
