import { describe, expect, it } from 'vitest';
import {
    assetIndexSampleMap,
    buildAssetIndex,
    buildHuggingFaceAssetUrl,
    buildLocalAssetUrl,
    isAssetIndex,
    missingTargetAssetEvidence,
    requestedLabelKey,
    targetLookupKey,
} from './asset-index.ts';
import type { MetadataRow } from './dataset-merge.ts';

const row = (overrides: Partial<MetadataRow> = {}): MetadataRow => ({
    file_name: 'counting/example-Q.png',
    sample_key: 'target#generator#view#train#question#inst:0',
    spec: 'ccss',
    target_id: 'target',
    generator: 'counting',
    view: 'counting-simple',
    mode: 'question',
    instance: 0,
    content_fingerprint: 'fp',
    tags: ['Addition', 'Counting'],
    ...overrides,
});

const targetLabels = new Map([
    [targetLookupKey('ccss', 'target'), ['http://edugraph.io/edu/Counting', 'http://edugraph.io/edu/Addition']],
]);

describe('buildAssetIndex', () => {
    it('groups independent question and solution rows by their requested labels', () => {
        const index = buildAssetIndex({
            rows: [
                { split: 'train', row: row() },
                { split: 'train', row: row({
                    file_name: 'counting/example-S.png',
                    mode: 'solution',
                    sample_key: 'target#generator#view#train#solution#inst:0',
                }) },
            ],
            targetLabels,
            repository: 'owner/dataset',
            revision: 'v1.0.0',
            generatedAt: '2026-08-11T00:00:00.000Z',
        });

        expect(index.label_sets).toHaveLength(1);
        expect(index.label_sets[0].requested_labels).toEqual([
            'http://edugraph.io/edu/Addition',
            'http://edugraph.io/edu/Counting',
        ]);
        expect(index.label_sets[0].samples.map(sample => sample.mode)).toEqual(['question', 'solution']);
        expect(index.label_sets[0].samples[0]).not.toHaveProperty('solution');
    });

    it('is deterministic apart from an explicitly supplied generation time', () => {
        const input = {
            rows: [
                { split: 'validation' as const, row: row({ file_name: 'z.png' }) },
                { split: 'train' as const, row: row({ file_name: 'a.png', mode: 'solution' }) },
            ],
            targetLabels,
            repository: 'owner/dataset',
            revision: 'v1',
            generatedAt: 'fixed',
        };
        expect(buildAssetIndex(input)).toEqual(buildAssetIndex({ ...input, rows: [...input.rows].reverse() }));
    });

    it('rejects mutable revisions, unknown targets, modes, and duplicate paths', () => {
        const base = {
            rows: [{ split: 'train' as const, row: row() }],
            targetLabels,
            repository: 'owner/dataset',
            revision: 'v1',
        };
        expect(() => buildAssetIndex({ ...base, revision: 'main' })).toThrow(/not "main"/);
        expect(() => buildAssetIndex({ ...base, targetLabels: new Map() })).toThrow(/Cannot resolve/);
        expect(() => buildAssetIndex({ ...base, rows: [{ split: 'train', row: row({ mode: 'other' }) }] })).toThrow(/Unsupported asset mode/);
        expect(() => buildAssetIndex({ ...base, rows: [...base.rows, ...base.rows] })).toThrow(/Duplicate released asset path/);
    });

    it('associates one physical sample with every deduplicated target permutation', () => {
        const associatedLabels = new Map([
            ...targetLabels,
            [targetLookupKey('ccss', 'associated'), ['http://edugraph.io/edu/Counting']],
        ]);
        const index = buildAssetIndex({
            rows: [{
                split: 'train',
                row: row({target_associations: [{spec: 'ccss', target_id: 'associated'}]}),
            }],
            targetLabels: associatedLabels,
            repository: 'owner/dataset',
            revision: 'v1',
            generatedAt: 'fixed',
        });

        expect(index.label_sets).toHaveLength(2);
        expect(index.label_sets.flatMap(group => group.samples.map(sample => sample.file_name)))
            .toEqual(['counting/example-Q.png', 'counting/example-Q.png']);
    });
});

describe('asset-index helpers', () => {
    it('matches label sets independent of label order and duplication', () => {
        expect(requestedLabelKey(['b', 'a', 'a'])).toBe(requestedLabelKey(['a', 'b']));
    });

    it('maps label sets and builds encoded, tag-pinned Hugging Face URLs', () => {
        const index = buildAssetIndex({
            rows: [{ split: 'train', row: row({ file_name: 'folder/file name.png' }) }],
            targetLabels,
            repository: 'owner/data set',
            revision: 'v1/preview',
            generatedAt: 'fixed',
        });
        const group = assetIndexSampleMap(index).values().next().value!;
        expect(buildHuggingFaceAssetUrl(index.dataset, group.samples[0])).toBe(
            'https://huggingface.co/datasets/owner/data%20set/resolve/v1%2Fpreview/train/folder/file%20name.png',
        );
        expect(buildLocalAssetUrl(group.samples[0])).toBe(
            '/dataset/local/train/folder/file%20name.png',
        );
        expect(isAssetIndex(index)).toBe(true);
        expect(isAssetIndex({ ...index, schema_version: 2 })).toBe(false);
        expect(isAssetIndex({ ...index, dataset: { ...index.dataset, revision: 'main' } })).toBe(false);
        expect(isAssetIndex({ ...index, dataset: { ...index.dataset, repository: ' ' } })).toBe(false);
    });

    it('reports exact production target permutations missing from the index', () => {
        const index = buildAssetIndex({
            rows: [{split: 'train', row: row()}],
            targetLabels,
            repository: 'owner/dataset',
            revision: 'v1',
            generatedAt: 'fixed',
        });
        const targets = [
            {id: 'target', labels: [...targetLabels.values()][0]},
            {id: 'missing', labels: ['http://edugraph.io/edu/Subtraction']},
        ];

        expect(missingTargetAssetEvidence(index, targets)).toEqual([{
            targetId: 'missing',
            labels: ['http://edugraph.io/edu/Subtraction'],
        }]);
    });
});
