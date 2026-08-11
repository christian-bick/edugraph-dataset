import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
    buildAssetIndex,
    targetLookupKey,
    type AssetSplit,
} from '../lib/asset-index.ts';
import {
    emptyFingerprintIndex,
    groupIntoExercises,
    parseMetadataLines,
    selectUnionExercises,
    type FingerprintIndex,
    type MetadataRow,
} from '../lib/dataset-merge.ts';
import { datasetDirForSpec, datasetOutDir, UNION_DATASET_DIR } from '../lib/dataset-paths.ts';
import { listUnionSpecs, loadTargets } from '../lib/generation.ts';
import { normalizeAndValidateSpec, normalizeTargetLabels } from '../lib/spec-validator.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const outputPath = resolve(PROJECT_ROOT, readOption('output') ?? 'public/dataset/asset-index.json');
const repository = readOption('repository') ?? 'christian-bick/edugraph-exercises';
const requireOption = (name: string): string => {
    const value = readOption(name);
    if (!value) throw new Error(`Missing required --${name}=<value>.`);
    return value;
};
const revision = requireOption('revision');

function readSpecSplit(specName: string, split: AssetSplit): MetadataRow[] {
    const specDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName));
    const splitDir = resolve(specDir, split);
    if (!existsSync(splitDir)) return [];

    return readdirSync(splitDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort()
        .flatMap(moduleName => {
            const metadataPath = resolve(splitDir, moduleName, '.metadata.jsonl');
            if (!existsSync(metadataPath)) return [];
            return parseMetadataLines(readFileSync(metadataPath, 'utf-8'))
                .map(row => ({ ...row, file_name: `${moduleName}/${row.file_name}` }));
        });
}

function selectSplitRows(
    split: AssetSplit,
    specNames: string[],
    excluded?: FingerprintIndex,
): { rows: Array<{ split: AssetSplit; row: MetadataRow }>; index: FingerprintIndex } {
    const index = emptyFingerprintIndex();
    const rows: Array<{ split: AssetSplit; row: MetadataRow }> = [];

    for (const specName of specNames) {
        const { kept } = selectUnionExercises(
            groupIntoExercises(readSpecSplit(specName, split)),
            index,
            excluded,
        );
        for (const exercise of kept) {
            rows.push(...exercise.rows.map(row => ({ split, row })));
        }
    }
    return { rows, index };
}

async function loadTargetLabels(specNames: string[]): Promise<Map<string, readonly string[]>> {
    const targetLabels = new Map<string, readonly string[]>();
    for (const specName of specNames) {
        const result = await normalizeAndValidateSpec(specName);
        if (result.errors.length > 0) {
            throw new Error(`Cannot index invalid spec "${specName}":\n${result.errors.join('\n')}`);
        }
        // Read every source target after validation, not only the current
        // overlap representative. A released row can legitimately name an
        // equivalent target that was the representative when it was built.
        for (const target of normalizeTargetLabels(await loadTargets(specName))) {
            targetLabels.set(targetLookupKey(specName, target.id), target.labels);
        }
    }
    return targetLabels;
}

async function main(): Promise<void> {
    const specNames = await listUnionSpecs();
    if (specNames.length === 0) throw new Error('No non-isolated specs are available for the union.');

    const unionDir = datasetOutDir(PROJECT_ROOT, UNION_DATASET_DIR);
    if (!existsSync(unionDir)) {
        throw new Error(`Merged union dataset not found at ${unionDir}. Run npm run merge:dataset first.`);
    }

    const missingSpecs = specNames.filter(specName =>
        !existsSync(datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName))));
    if (missingSpecs.length > 0) {
        throw new Error(`Generated datasets missing for: ${missingSpecs.join(', ')}.`);
    }

    const train = selectSplitRows('train', specNames);
    const validation = selectSplitRows('validation', specNames, train.index);
    const selectedRows = [...train.rows, ...validation.rows];

    for (const { split, row } of selectedRows) {
        const imagePath = resolve(unionDir, split, row.file_name);
        if (!existsSync(imagePath)) {
            throw new Error(`Union image missing for selected row: ${split}/${row.file_name}.`);
        }
    }

    const index = buildAssetIndex({
        rows: selectedRows,
        targetLabels: await loadTargetLabels(specNames),
        repository,
        revision,
    });

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf-8');

    console.log(`Asset index: ${outputPath}`);
    console.log(`Dataset:     ${repository}@${revision}`);
    console.log(`Label sets:  ${index.label_sets.length}`);
    console.log(`Samples:     ${selectedRows.length}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
