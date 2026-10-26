import {copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync} from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {listUnionSpecs} from '../lib/spec-catalog.ts';
import {
    UNION_DATASET_DIR,
    datasetDirForSpec,
    datasetOutDir,
} from '../lib/dataset-paths.ts';
import {
    claimFingerprint,
    emptyFingerprintIndex,
    groupIntoExercises,
    selectUnionExercises,
    toPublishedMetadataRow,
    type Exercise,
    type FingerprintIndex,
    type MetadataRow,
} from '../lib/dataset-merge.ts';
import {readDatasetSnapshot, type DatasetSnapshot} from '../lib/dataset-store.ts';
import {auditPublishedImages, formatDatasetImageAudit} from '../lib/dataset-image-audit.ts';
import {inspectLabelDependencies} from '../lib/label-dependency-inspection.ts';
import {summarizeLabelDependencyCoverage} from '../lib/label-dependency-coverage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

interface SpecContribution {
    specName: string;
    offered: number;
    kept: number;
    dropped: number;
}

/** Reads one spec's rows for a split, from the module-level metadata files. */
function readSpecSplit(snapshot: DatasetSnapshot, splitDirName: string): MetadataRow[] {
    const split = splitDirName === 'train' ? 'train' : 'val';
    return snapshot.rows(split) as MetadataRow[];
}

/** Copies an exercise's images into the union and returns its rows. */
function copyExercise(
    exercise: Exercise,
    snapshot: DatasetSnapshot,
    splitDirName: string,
    unionSplitDir: string
): MetadataRow[] {
    const split = splitDirName === 'train' ? 'train' : 'val';
    for (const row of exercise.rows) {
        const source = snapshot.imagePath(split, row.sample_key);
        const destination = resolve(unionSplitDir, row.file_name);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(source, destination);
    }
    return exercise.rows;
}

function mergeSplit(
    splitDirName: string,
    unionSpecs: string[],
    unionDir: string,
    snapshots: ReadonlyMap<string, DatasetSnapshot>,
    trainContentIndex?: FingerprintIndex
): {
    rows: MetadataRow[];
    contributions: SpecContribution[];
    contentIndex: FingerprintIndex;
} {
    const taskIndex = emptyFingerprintIndex();
    const contentIndex = emptyFingerprintIndex();
    const unionSplitDir = resolve(unionDir, splitDirName);
    const rows: MetadataRow[] = [];
    const contributions: SpecContribution[] = [];

    for (const specName of unionSpecs) {
        const snapshot = snapshots.get(specName)!;
        const exercises = groupIntoExercises(readSpecSplit(snapshot, splitDirName));
        const { kept, dropped } = selectUnionExercises(exercises, taskIndex, trainContentIndex);

        for (const exercise of kept) {
            claimFingerprint(contentIndex, exercise.view, exercise.contentFingerprint);
            rows.push(...copyExercise(exercise, snapshot, splitDirName, unionSplitDir));
        }

        contributions.push({
            specName,
            offered: exercises.length,
            kept: kept.length,
            dropped: dropped.length,
        });
    }

    if (rows.length > 0) {
        mkdirSync(unionSplitDir, { recursive: true });
        writeFileSync(
            resolve(unionSplitDir, 'metadata.jsonl'),
            rows.map(row => JSON.stringify(toPublishedMetadataRow(row))).join('\n') + '\n',
            'utf-8'
        );
    }

    return { rows, contributions, contentIndex };
}

async function main(): Promise<void> {
    const unionSpecs = await listUnionSpecs();

    console.log(`\n=== Merging Union Dataset ===`);
    if (unionSpecs.length === 0) {
        console.error('❌ No non-isolated spec modules found — nothing to merge.');
        process.exit(1);
    }
    console.log(`Merge order: ${unionSpecs.join(' -> ')}`);

    const missing = unionSpecs.filter(specName =>
        !existsSync(datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName))));
    if (missing.length > 0) {
        console.error(`❌ No generated dataset for: ${missing.join(', ')}.`);
        console.error(`   Run: npm run generate:dataset -- --spec=<spec> for each, then merge.`);
        process.exit(1);
    }

    // Validate one immutable snapshot per source before replacing an existing union.
    const snapshots = new Map<string, DatasetSnapshot>();
    for (const specName of unionSpecs) {
        const snapshot = readDatasetSnapshot(datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName)));
        const coverage = summarizeLabelDependencyCoverage(await inspectLabelDependencies({
            projectRoot: PROJECT_ROOT, spec: specName, snapshot}));
        if (coverage.failures.length) throw new Error(`Source ${specName} failed scoped label dependencies:\n` +
            coverage.failures.map(failure => `${failure.subject}: ${failure.message}`).join('\n'));
        snapshots.set(specName, snapshot);
    }

    // The union is fully derived, so replacing it wholesale is safe — unlike
    // the per-spec folders, which are the source of truth.
    const unionDir = datasetOutDir(PROJECT_ROOT, UNION_DATASET_DIR);
    if (existsSync(unionDir)) {
        rmSync(unionDir, { recursive: true, force: true });
    }
    mkdirSync(unionDir, { recursive: true });

    // Train is merged first so validation can exclude content already in it,
    // mirroring the generation-time rule across standards.
    const train = mergeSplit('train', unionSpecs, unionDir, snapshots);
    const validation = mergeSplit('validation', unionSpecs, unionDir, snapshots, train.contentIndex);
    const imageAudit = auditPublishedImages(unionDir);
    console.log(formatDatasetImageAudit(imageAudit));
    if (imageAudit.issues.length > 0) {
        throw new Error('Merged dataset failed image byte validation; resolve the reported conflicts before publication.');
    }

    console.log(`\n--- Contribution by Standard ---`);
    console.log(`| Standard | Split | Offered | Merged | Duplicate |`);
    console.log(`| :--- | :--- | ---: | ---: | ---: |`);
    for (const [splitName, result] of [['train', train], ['validation', validation]] as const) {
        for (const contribution of result.contributions) {
            console.log(`| ${contribution.specName} | ${splitName} | ${contribution.offered} | ${contribution.kept} | ${contribution.dropped} |`);
        }
    }

    console.log(`\n--- Totals ---`);
    console.log(`Train samples:      ${train.rows.length}`);
    console.log(`Validation samples: ${validation.rows.length}`);
    console.log(`Union dataset:      ${unionDir}`);
    console.log(`\n✅ Union dataset merged from ${unionSpecs.length} standard(s).`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
