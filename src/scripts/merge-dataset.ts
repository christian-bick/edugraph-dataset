import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { listUnionSpecs } from '../lib/generation.ts';
import {
    UNION_DATASET_DIR,
    datasetDirForSpec,
    datasetOutDir,
} from '../lib/dataset-paths.ts';
import {
    claimFingerprint,
    emptyFingerprintIndex,
    groupIntoExercises,
    parseMetadataLines,
    selectUnionExercises,
    toPublishedMetadataRow,
    type Exercise,
    type FingerprintIndex,
    type MetadataRow,
} from '../lib/dataset-merge.ts';

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
function readSpecSplit(specDir: string, splitDirName: string): MetadataRow[] {
    const splitDir = resolve(specDir, splitDirName);
    if (!existsSync(splitDir)) return [];

    const rows: MetadataRow[] = [];
    const modules = readdirSync(splitDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

    for (const moduleName of modules) {
        const modulePath = resolve(splitDir, moduleName, '.metadata.jsonl');
        if (!existsSync(modulePath)) continue;
        for (const row of parseMetadataLines(readFileSync(modulePath, 'utf-8'))) {
            // `file_name` is module-relative on disk; qualify it for the union root.
            rows.push({ ...row, file_name: `${moduleName}/${row.file_name}` });
        }
    }
    return rows;
}

/** Copies an exercise's images into the union and returns its rows. */
function copyExercise(exercise: Exercise, specSplitDir: string, unionSplitDir: string): MetadataRow[] {
    for (const row of exercise.rows) {
        const source = resolve(specSplitDir, row.file_name);
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
        const specSplitDir = resolve(datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName)), splitDirName);
        const exercises = groupIntoExercises(readSpecSplit(
            datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName)),
            splitDirName
        ));
        const { kept, dropped } = selectUnionExercises(exercises, taskIndex, trainContentIndex);

        for (const exercise of kept) {
            claimFingerprint(contentIndex, exercise.view, exercise.contentFingerprint);
            rows.push(...copyExercise(exercise, specSplitDir, unionSplitDir));
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

    // The union is fully derived, so replacing it wholesale is safe — unlike
    // the per-spec folders, which are the source of truth.
    const unionDir = datasetOutDir(PROJECT_ROOT, UNION_DATASET_DIR);
    if (existsSync(unionDir)) {
        rmSync(unionDir, { recursive: true, force: true });
    }
    mkdirSync(unionDir, { recursive: true });

    // Train is merged first so validation can exclude content already in it,
    // mirroring the generation-time rule across standards.
    const train = mergeSplit('train', unionSpecs, unionDir);
    const validation = mergeSplit('validation', unionSpecs, unionDir, train.contentIndex);

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
