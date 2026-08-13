import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    buildAssetIndex,
    targetLookupKey,
    type AssetIndex,
    type AssetSplit,
} from './asset-index.ts';
import {
    emptyFingerprintIndex,
    groupIntoExercises,
    parseMetadataLines,
    selectUnionExercises,
    type FingerprintIndex,
    type MetadataRow,
} from './dataset-merge.ts';
import { datasetDirForSpec, datasetOutDir, UNION_DATASET_DIR } from './dataset-paths.ts';
import { listUnionSpecs, loadTargets } from './generation.ts';
import { normalizeAndValidateSpec, normalizeTargetLabels } from './spec-validator.ts';

export interface AssetIndexBundle {
    index: AssetIndex;
    /** Local source image paths keyed by `<split>/<file_name>`. */
    localAssets: Map<string, string>;
}

interface SelectedRows {
    rows: Array<{ split: AssetSplit; row: MetadataRow }>;
    index: FingerprintIndex;
    localAssets: Map<string, string>;
}

const localAssetKey = (split: AssetSplit, fileName: string): string =>
    `${split}/${fileName.replaceAll('\\', '/')}`;

function readSpecSplit(projectRoot: string, specName: string, split: AssetSplit): MetadataRow[] {
    const specDir = datasetOutDir(projectRoot, datasetDirForSpec(specName));
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
    projectRoot: string,
    split: AssetSplit,
    specNames: string[],
    excluded?: FingerprintIndex,
): SelectedRows {
    const index = emptyFingerprintIndex();
    const rows: SelectedRows['rows'] = [];
    const localAssets = new Map<string, string>();

    for (const specName of specNames) {
        const specDir = datasetOutDir(projectRoot, datasetDirForSpec(specName));
        const { kept } = selectUnionExercises(
            groupIntoExercises(readSpecSplit(projectRoot, specName, split)),
            index,
            excluded,
        );
        for (const exercise of kept) {
            for (const row of exercise.rows) {
                rows.push({ split, row });
                localAssets.set(
                    localAssetKey(split, row.file_name),
                    resolve(specDir, split, row.file_name),
                );
            }
        }
    }
    return { rows, index, localAssets };
}

async function loadTargetLabels(specNames: string[]): Promise<Map<string, readonly string[]>> {
    const targetLabels = new Map<string, readonly string[]>();
    for (const specName of specNames) {
        const result = await normalizeAndValidateSpec(specName);
        if (result.errors.length > 0) {
            throw new Error(`Cannot index invalid spec "${specName}":\n${result.errors.join('\n')}`);
        }
        // Include every source target, not only the current overlap representative:
        // retained generated rows can name whichever equivalent target represented it.
        for (const target of normalizeTargetLabels(await loadTargets(specName))) {
            targetLabels.set(targetLookupKey(specName, target.id), target.labels);
        }
    }
    return targetLabels;
}

export interface BuildAssetIndexBundleOptions {
    projectRoot: string;
    repository: string;
    revision: string;
    requireMergedUnion?: boolean;
    specNames?: string[];
    targetLabels?: Map<string, readonly string[]>;
}

/** Replays union selection from generated standard metadata for CI and local previews. */
export async function buildAssetIndexBundle({
    projectRoot,
    repository,
    revision,
    requireMergedUnion = false,
    specNames: requestedSpecNames,
    targetLabels: providedTargetLabels,
}: BuildAssetIndexBundleOptions): Promise<AssetIndexBundle> {
    const specNames = requestedSpecNames ?? await listUnionSpecs();
    if (specNames.length === 0) throw new Error('No non-isolated specs are available for the union.');

    const missingSpecs = specNames.filter(specName =>
        !existsSync(datasetOutDir(projectRoot, datasetDirForSpec(specName))));
    if (missingSpecs.length > 0) {
        throw new Error(`Generated datasets missing for: ${missingSpecs.join(', ')}.`);
    }

    const train = selectSplitRows(projectRoot, 'train', specNames);
    const validation = selectSplitRows(projectRoot, 'validation', specNames, train.index);
    const selectedRows = [...train.rows, ...validation.rows];
    const localAssets = new Map([...train.localAssets, ...validation.localAssets]);

    for (const [key, imagePath] of localAssets) {
        if (!existsSync(imagePath)) throw new Error(`Generated image missing for selected row: ${key}.`);
    }

    if (requireMergedUnion) {
        const unionDir = datasetOutDir(projectRoot, UNION_DATASET_DIR);
        if (!existsSync(unionDir)) {
            throw new Error(`Merged union dataset not found at ${unionDir}. Run npm run merge:dataset first.`);
        }
        for (const { split, row } of selectedRows) {
            if (!existsSync(resolve(unionDir, split, row.file_name))) {
                throw new Error(`Union image missing for selected row: ${split}/${row.file_name}.`);
            }
        }
    }

    return {
        index: buildAssetIndex({
            rows: selectedRows,
            targetLabels: providedTargetLabels ?? await loadTargetLabels(specNames),
            repository,
            revision,
        }),
        localAssets,
    };
}
