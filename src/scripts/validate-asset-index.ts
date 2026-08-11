import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { isAssetIndex, requestedLabelKey, type AssetIndex } from '../lib/asset-index.ts';
import { shortenLabel } from '../lib/utils.ts';

const PROJECT_ROOT = resolve('.');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const indexPath = resolve(PROJECT_ROOT, readOption('index') ?? 'public/dataset/asset-index.json');
const datasetDir = resolve(PROJECT_ROOT, readOption('dataset-dir') ?? 'out/dataset');

interface PublicRow {
    file_name: string;
    tags: string[];
    solution: boolean;
}

function readPublicRows(split: 'train' | 'validation'): PublicRow[] {
    const metadataPath = resolve(datasetDir, split, 'metadata.jsonl');
    if (!existsSync(metadataPath)) throw new Error(`Published metadata missing: ${metadataPath}.`);
    return readFileSync(metadataPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as PublicRow);
}

function validate(index: AssetIndex): string[] {
    const errors: string[] = [];
    if (!index.dataset.repository.trim()) errors.push('Dataset repository is empty.');
    if (!index.dataset.revision.trim() || index.dataset.revision === 'main') {
        errors.push('Dataset revision must be an immutable release tag or commit, not main.');
    }

    const publicRows = new Map<string, PublicRow>();
    for (const split of ['train', 'validation'] as const) {
        for (const row of readPublicRows(split)) {
            const key = `${split}\0${row.file_name}`;
            if (publicRows.has(key)) errors.push(`Duplicate public metadata path: ${split}/${row.file_name}.`);
            publicRows.set(key, row);
        }
    }

    const indexedRows = new Set<string>();
    const labelKeys = new Set<string>();
    let previousLabelKey = '';
    for (const group of index.label_sets) {
        const key = requestedLabelKey(group.requested_labels);
        if (labelKeys.has(key)) errors.push(`Duplicate requested label set: ${key}.`);
        if (previousLabelKey && previousLabelKey.localeCompare(key) > 0) {
            errors.push(`Requested label sets are not sorted: ${key}.`);
        }
        previousLabelKey = key;
        labelKeys.add(key);

        if (JSON.stringify(group.requested_labels) !== JSON.stringify([...new Set(group.requested_labels)].sort())) {
            errors.push(`Requested labels are not canonical: ${key}.`);
        }
        if (group.samples.length === 0) errors.push(`Requested label set has no samples: ${key}.`);

        for (const sample of group.samples) {
            const sampleKey = `${sample.split}\0${sample.file_name}`;
            if (indexedRows.has(sampleKey)) {
                errors.push(`Asset indexed more than once: ${sample.split}/${sample.file_name}.`);
                continue;
            }
            indexedRows.add(sampleKey);

            const publicRow = publicRows.get(sampleKey);
            if (!publicRow) {
                errors.push(`Indexed asset is absent from public metadata: ${sample.split}/${sample.file_name}.`);
                continue;
            }
            const expectedMode = publicRow.solution ? 'solution' : 'question';
            if (sample.mode !== expectedMode) {
                errors.push(`Mode mismatch for ${sample.split}/${sample.file_name}: ${sample.mode} vs ${expectedMode}.`);
            }
            const publicTags = new Set(publicRow.tags);
            for (const label of group.requested_labels.map(shortenLabel)) {
                if (!publicTags.has(label)) {
                    errors.push(`Requested label ${label} is absent from ${sample.split}/${sample.file_name}.`);
                }
            }
            if (!existsSync(resolve(datasetDir, sample.split, sample.file_name))) {
                errors.push(`Indexed image is missing on disk: ${sample.split}/${sample.file_name}.`);
            }
        }
    }

    for (const key of publicRows.keys()) {
        if (!indexedRows.has(key)) {
            const [split, fileName] = key.split('\0');
            errors.push(`Published asset is missing from the index: ${split}/${fileName}.`);
        }
    }
    return errors;
}

function main(): void {
    if (!existsSync(indexPath)) throw new Error(`Asset index not found: ${indexPath}.`);
    const parsed: unknown = JSON.parse(readFileSync(indexPath, 'utf-8'));
    if (!isAssetIndex(parsed)) throw new Error(`Invalid asset-index schema: ${indexPath}.`);

    const errors = validate(parsed);
    if (errors.length > 0) {
        console.error(`Asset index validation failed with ${errors.length} error(s):`);
        errors.forEach(error => console.error(`- ${error}`));
        process.exit(1);
    }

    const sampleCount = parsed.label_sets.reduce((sum, group) => sum + group.samples.length, 0);
    console.log(`Asset index valid: ${indexPath}`);
    console.log(`Label sets: ${parsed.label_sets.length}`);
    console.log(`Samples:    ${sampleCount}`);
}

try {
    main();
} catch (error) {
    console.error(error);
    process.exit(1);
}
