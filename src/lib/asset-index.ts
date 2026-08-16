import { labelSetKey } from './utils.ts';
import { rowTargetAssociations, type MetadataRow } from './dataset-merge.ts';
import type { CompetencyTarget } from '../types/ml-engine.ts';

export const ASSET_INDEX_SCHEMA_VERSION = 1;

export type AssetSplit = 'train' | 'validation';
export type AssetMode = 'question' | 'solution';

export interface ReleasedAssetSample {
    split: AssetSplit;
    file_name: string;
    generator: string;
    view: string;
    mode: AssetMode;
}

export interface ReleasedAssetLabelSet {
    requested_labels: string[];
    samples: ReleasedAssetSample[];
}

export interface AssetIndex {
    schema_version: number;
    generated_at: string;
    dataset: {
        repository: string;
        revision: string;
    };
    label_sets: ReleasedAssetLabelSet[];
}

export interface BuildAssetIndexInput {
    rows: Array<{ split: AssetSplit; row: MetadataRow }>;
    targetLabels: ReadonlyMap<string, readonly string[]>;
    repository: string;
    revision: string;
    generatedAt?: string;
}

export const targetLookupKey = (spec: string, targetId: string): string =>
    `${spec}\0${targetId}`;

export const canonicalLabels = (labels: readonly string[]): string[] =>
    [...new Set(labels)].sort();

export const requestedLabelKey = (labels: readonly string[]): string =>
    labelSetKey(canonicalLabels(labels));

const splitOrder: Record<AssetSplit, number> = { train: 0, validation: 1 };
const modeOrder: Record<AssetMode, number> = { question: 0, solution: 1 };

const compareSamples = (left: ReleasedAssetSample, right: ReleasedAssetSample): number =>
    splitOrder[left.split] - splitOrder[right.split]
    || left.generator.localeCompare(right.generator)
    || left.view.localeCompare(right.view)
    || modeOrder[left.mode] - modeOrder[right.mode]
    || left.file_name.localeCompare(right.file_name);

/** Builds the public, release-pinned image index from rows retained by the union selection. */
export function buildAssetIndex({
    rows,
    targetLabels,
    repository,
    revision,
    generatedAt = new Date().toISOString(),
}: BuildAssetIndexInput): AssetIndex {
    if (!repository.trim()) throw new Error('Asset index repository is required.');
    if (!revision.trim() || revision === 'main') {
        throw new Error('Asset index revision must be an immutable release tag or commit, not "main".');
    }

    const grouped = new Map<string, ReleasedAssetLabelSet>();
    const groupedSamplePaths = new Map<string, Set<string>>();
    const samplePaths = new Set<string>();

    for (const { split, row } of rows) {
        if (row.mode !== 'question' && row.mode !== 'solution') {
            throw new Error(`Unsupported asset mode "${row.mode}" for ${row.sample_key}.`);
        }
        const samplePath = `${split}\0${row.file_name}`;
        if (samplePaths.has(samplePath)) {
            throw new Error(`Duplicate released asset path: ${split}/${row.file_name}.`);
        }
        samplePaths.add(samplePath);

        for (const association of rowTargetAssociations(row)) {
            const labels = targetLabels.get(targetLookupKey(association.spec, association.target_id));
            if (!labels) {
                throw new Error(`Cannot resolve requested labels for ${association.spec}:${association.target_id}.`);
            }

            const requestedLabels = canonicalLabels(labels);
            const key = requestedLabelKey(requestedLabels);
            const group = grouped.get(key) ?? { requested_labels: requestedLabels, samples: [] };
            const groupPaths = groupedSamplePaths.get(key) ?? new Set<string>();
            if (!groupPaths.has(samplePath)) {
                group.samples.push({
                    split,
                    file_name: row.file_name,
                    generator: row.generator,
                    view: row.view,
                    mode: row.mode,
                });
                groupPaths.add(samplePath);
            }
            grouped.set(key, group);
            groupedSamplePaths.set(key, groupPaths);
        }
    }

    return {
        schema_version: ASSET_INDEX_SCHEMA_VERSION,
        generated_at: generatedAt,
        dataset: { repository, revision },
        label_sets: [...grouped.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([, group]) => ({
                requested_labels: group.requested_labels,
                samples: [...group.samples].sort(compareSamples),
            })),
    };
}

export function assetIndexSampleMap(index: AssetIndex): Map<string, ReleasedAssetLabelSet> {
    return new Map(index.label_sets.map(group => [requestedLabelKey(group.requested_labels), group]));
}

export interface MissingTargetAssetEvidence {
    targetId: string;
    labels: string[];
}

/** Exact production target permutations that have no physical sample association in an index. */
export function missingTargetAssetEvidence(
    index: AssetIndex,
    targets: readonly CompetencyTarget[]
): MissingTargetAssetEvidence[] {
    const indexedLabelKeys = new Set(index.label_sets
        .filter(group => group.samples.length > 0)
        .map(group => requestedLabelKey(group.requested_labels)));
    return targets
        .filter(target => !indexedLabelKeys.has(requestedLabelKey(target.labels)))
        .map(target => ({targetId: target.id, labels: canonicalLabels(target.labels)}));
}

export function buildHuggingFaceAssetUrl(
    dataset: AssetIndex['dataset'],
    sample: Pick<ReleasedAssetSample, 'split' | 'file_name'>,
): string {
    const repository = dataset.repository.split('/').map(encodeURIComponent).join('/');
    const revision = encodeURIComponent(dataset.revision);
    const fileName = sample.file_name.split('/').map(encodeURIComponent).join('/');
    return `https://huggingface.co/datasets/${repository}/resolve/${revision}/${sample.split}/${fileName}`;
}

export function buildLocalAssetUrl(
    sample: Pick<ReleasedAssetSample, 'split' | 'file_name'>,
): string {
    const fileName = sample.file_name.split('/').map(encodeURIComponent).join('/');
    return `/dataset/local/${sample.split}/${fileName}`;
}

export function isAssetIndex(value: unknown): value is AssetIndex {
    if (!value || typeof value !== 'object') return false;
    const index = value as Partial<AssetIndex>;
    if (index.schema_version !== ASSET_INDEX_SCHEMA_VERSION
        || typeof index.generated_at !== 'string'
        || !index.dataset
        || typeof index.dataset.repository !== 'string'
        || !index.dataset.repository.trim()
        || typeof index.dataset.revision !== 'string'
        || !index.dataset.revision.trim()
        || index.dataset.revision === 'main'
        || !Array.isArray(index.label_sets)) return false;

    return index.label_sets.every(group =>
        Array.isArray(group.requested_labels)
        && group.requested_labels.every(label => typeof label === 'string')
        && Array.isArray(group.samples)
        && group.samples.every(sample =>
            (sample.split === 'train' || sample.split === 'validation')
            && typeof sample.file_name === 'string'
            && typeof sample.generator === 'string'
            && typeof sample.view === 'string'
            && (sample.mode === 'question' || sample.mode === 'solution')));
}
