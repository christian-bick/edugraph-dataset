import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {digestFile, radixSortUtf8, type ContentDigest} from './content-identity.ts';
import {toPublishedMetadataRow, type MetadataRow, type PublishedMetadataRow} from './dataset-merge.ts';
import type {DatasetSnapshot} from './dataset-store.ts';
import {SPLIT_DIRS, type SampleSplit} from './generation.ts';

export interface ImageAuditSample {
    path: string;
    imagePath: string;
    split: SampleSplit;
    labels: string[];
    solution: boolean;
    expectedImage?: ContentDigest;
}

export interface DuplicateImageGroup {
    sha256: string;
    samples: ImageAuditSample[];
    labelConflict: boolean;
    solutionConflict: boolean;
    crossSplit: boolean;
}

export interface DatasetImageAudit {
    checked: number;
    bytesRead: number;
    duplicates: DuplicateImageGroup[];
    issues: string[];
    warnings: string[];
}

function describeDuplicate(group: DuplicateImageGroup): string {
    const reasons = [
        group.labelConflict && 'conflicting labels',
        group.solutionConflict && 'conflicting question/solution flags',
        group.crossSplit && 'train/validation leakage'
    ].filter(Boolean);
    return `Byte-identical images (SHA-256 ${group.sha256}): ${reasons.join(', ') || 'redundant copies'}.\n`
        + group.samples.map(sample =>
            `  ${sample.path} [${sample.labels.join(', ')}] solution=${sample.solution}`).join('\n');
}

/** Compares actual file bytes globally, independent of generator, view, task identity, or split. */
export function auditDatasetImageSamples(samples: readonly ImageAuditSample[]): DatasetImageAudit {
    const byHash = new Map<string, ImageAuditSample[]>();
    const issues: string[] = [];
    let checked = 0;
    let bytesRead = 0;
    for (const sample of samples) {
        try {
            const digest = digestFile(sample.imagePath);
            checked++;
            bytesRead += digest.bytes;
            if (sample.expectedImage
                && (digest.sha256 !== sample.expectedImage.sha256 || digest.bytes !== sample.expectedImage.bytes)) {
                issues.push(`Image integrity mismatch for ${sample.path}.`);
            }
            const group = byHash.get(digest.sha256) ?? [];
            group.push({...sample, labels: radixSortUtf8([...new Set(sample.labels)])});
            byHash.set(digest.sha256, group);
        } catch (error) {
            issues.push(`Cannot read ${sample.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const duplicates: DuplicateImageGroup[] = [];
    const warnings: string[] = [];
    for (const sha256 of radixSortUtf8([...byHash.keys()])) {
        const group = byHash.get(sha256)!;
        if (group.length < 2) continue;
        const duplicate: DuplicateImageGroup = {
            sha256,
            samples: [...group].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0),
            labelConflict: new Set(group.map(sample => JSON.stringify(sample.labels))).size > 1,
            solutionConflict: new Set(group.map(sample => sample.solution)).size > 1,
            crossSplit: new Set(group.map(sample => sample.split)).size > 1
        };
        duplicates.push(duplicate);
        const findings = duplicate.labelConflict || duplicate.solutionConflict || duplicate.crossSplit ? issues : warnings;
        findings.push(describeDuplicate(duplicate));
    }
    if (samples.length === 0) issues.push('No dataset images found to audit.');
    return {checked, bytesRead, duplicates, issues: radixSortUtf8(issues), warnings};
}

function imageSample(row: PublishedMetadataRow, split: SampleSplit, imagePath: string): ImageAuditSample {
    if (!row || typeof row.file_name !== 'string' || !row.file_name
        || !Array.isArray(row.labels) || !row.labels.every(label => typeof label === 'string')
        || typeof row.solution !== 'boolean') {
        throw new Error(`Invalid image metadata in ${SPLIT_DIRS[split]}: expected file_name, string labels, and a boolean solution flag.`);
    }
    return {path: `${SPLIT_DIRS[split]}/${row.file_name}`, imagePath, split, labels: row.labels, solution: row.solution};
}

/** Audits the current logical standard snapshot; obsolete shards are never included. */
export function auditSnapshotImages(snapshot: DatasetSnapshot): DatasetImageAudit {
    return auditDatasetImageSamples((Object.keys(SPLIT_DIRS) as SampleSplit[]).flatMap(split =>
        snapshot.rows(split).map(row => ({
            ...imageSample(toPublishedMetadataRow(row as MetadataRow), split, snapshot.imagePath(split, row.sample_key)),
            expectedImage: snapshot.imageIdentity(split, row.sample_key)
        }))
    ));
}

/** Audits the exact compact rows and PNG files that will be published in the merged union. */
export function auditPublishedImages(datasetDir: string): DatasetImageAudit {
    return auditDatasetImageSamples((Object.keys(SPLIT_DIRS) as SampleSplit[]).flatMap(split => {
        const splitDir = resolve(datasetDir, SPLIT_DIRS[split]);
        return readFileSync(resolve(splitDir, 'metadata.jsonl'), 'utf-8').split('\n')
            .filter(line => line.trim()).map(line => {
                const row = JSON.parse(line) as PublishedMetadataRow;
                const sample = imageSample(row, split, '');
                return {...sample, imagePath: resolve(splitDir, row.file_name)};
            });
    }));
}

export function formatDatasetImageAudit(audit: DatasetImageAudit): string {
    return [
        `Image byte audit: ${audit.checked} images, ${audit.duplicates.length} duplicate group(s), ${audit.issues.length} error(s), ${audit.warnings.length} warning(s).`,
        ...audit.issues.map(issue => `ERROR: ${issue}`),
        ...audit.warnings.map(warning => `WARNING: ${warning}`)
    ].join('\n');
}
