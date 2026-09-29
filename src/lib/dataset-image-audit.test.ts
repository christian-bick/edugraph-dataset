import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
    auditDatasetImageSamples, auditPublishedImages, auditSnapshotImages,
    formatDatasetImageAudit, type ImageAuditSample
} from './dataset-image-audit.ts';
import {beginDatasetStoreTransaction, readDatasetSnapshot} from './dataset-store.ts';
import {digestContent} from './content-identity.ts';

let fixture: string;
beforeEach(() => {
    const temp = fileURLToPath(new URL('../../temp/', import.meta.url));
    mkdirSync(temp, {recursive: true});
    fixture = mkdtempSync(resolve(temp, 'image-audit-'));
});
afterEach(() => rmSync(fixture, {recursive: true, force: true}));

function sample(name: string, bytes: string, overrides: Partial<ImageAuditSample> = {}): ImageAuditSample {
    const imagePath = resolve(fixture, name);
    mkdirSync(dirname(imagePath), {recursive: true});
    writeFileSync(imagePath, bytes);
    return {path: `train/${name}`, imagePath, split: 'train', labels: ['Addition'], solution: false, ...overrides};
}

function published(rows: unknown[], validation: unknown[] = []) {
    for (const [split, entries] of [['train', rows], ['validation', validation]] as const) {
        const directory = resolve(fixture, split);
        mkdirSync(directory, {recursive: true});
        writeFileSync(resolve(directory, 'metadata.jsonl'), entries.map(row => JSON.stringify(row)).join('\n') + '\n');
    }
}

describe('dataset image byte audit', () => {
    it('accepts distinct bytes, even for otherwise identical metadata', () => {
        const audit = auditDatasetImageSamples([sample('a.png', 'one'), sample('b.png', 'two')]);
        expect(audit).toEqual({checked: 2, bytesRead: 6, duplicates: [], issues: [], warnings: []});
    });

    it('rejects the same bytes with conflicting labels regardless of filename, generator, or view', () => {
        const addition = sample('angles/addition-view.png', 'same-png', {labels: ['Addition', 'AdjacentAngles']});
        const subtraction = sample('other/subtraction-view.png', 'same-png', {labels: ['Subtraction', 'AdjacentAngles']});
        const audit = auditDatasetImageSamples([addition, subtraction]);
        expect(audit.duplicates).toHaveLength(1);
        expect(audit.duplicates[0]).toMatchObject({labelConflict: true, solutionConflict: false, crossSplit: false});
        expect(audit.duplicates[0].sha256).toMatch(/^[a-f\d]{64}$/);
        expect(audit.issues).toHaveLength(1);
        expect(audit.issues[0]).toContain('conflicting labels');
        expect(audit.issues[0]).toContain('train/angles/addition-view.png [Addition, AdjacentAngles]');
        expect(audit.issues[0]).toContain('train/other/subtraction-view.png [AdjacentAngles, Subtraction]');
    });

    it('reports same-split copies with equal label sets as warnings, ignoring label order and repetition', () => {
        const a = sample('a.png', 'same', {labels: ['B', 'A', 'A']});
        const b = sample('b.png', 'same', {labels: ['A', 'B']});
        const audit = auditDatasetImageSamples([b, a, a]);
        expect(audit.issues).toEqual([]);
        expect(audit.warnings).toHaveLength(1);
        expect(audit.warnings[0]).toContain('redundant copies');
        expect(a.labels).toEqual(['B', 'A', 'A']);
        expect(audit.duplicates[0].samples.map(entry => entry.path)).toEqual(['train/a.png', 'train/a.png', 'train/b.png']);
        expect(formatDatasetImageAudit(audit)).toContain('WARNING: Byte-identical images');
    });

    it('rejects cross-split duplicates even when every target agrees', () => {
        const audit = auditDatasetImageSamples([
            sample('train.png', 'same'),
            sample('val.png', 'same', {split: 'val', path: 'validation/val.png'})
        ]);
        expect(audit.duplicates[0]).toMatchObject({crossSplit: true, labelConflict: false, solutionConflict: false});
        expect(audit.issues[0]).toContain('train/validation leakage');
    });

    it('rejects identical pixels assigned different question/solution flags', () => {
        const audit = auditDatasetImageSamples([
            sample('q.png', 'same'), sample('s.png', 'same', {solution: true})
        ]);
        expect(audit.duplicates[0].solutionConflict).toBe(true);
        expect(audit.issues[0]).toContain('conflicting question/solution flags');
        expect(audit.issues[0]).toContain('solution=true');
    });

    it('combines conflict reasons and produces deterministic groups and diagnostics', () => {
        const rows = [
            sample('a.png', 'first'),
            sample('b.png', 'first', {split: 'val', labels: ['Subtraction'], solution: true}),
            sample('c.png', 'second'), sample('d.png', 'second')
        ];
        const audit = auditDatasetImageSamples(rows);
        expect(audit).toEqual(auditDatasetImageSamples([...rows].reverse()));
        expect(audit.duplicates).toHaveLength(2);
        expect(audit.issues[0]).toContain('conflicting labels, conflicting question/solution flags, train/validation leakage');
        expect(formatDatasetImageAudit(audit)).toContain('4 images, 2 duplicate group(s), 1 error(s), 1 warning(s)');
        expect(formatDatasetImageAudit(audit)).toContain('ERROR: Byte-identical images');
    });

    it('hashes actual files afresh rather than trusting previous image identities', () => {
        const rows = [sample('a.png', 'same'), sample('b.png', 'same')];
        expect(auditDatasetImageSamples(rows).duplicates).toHaveLength(1);
        writeFileSync(rows[1].imagePath, 'changed');
        expect(auditDatasetImageSamples(rows).duplicates).toEqual([]);
    });

    it('checks both the recorded digest and size while hashing snapshot images', () => {
        const expected = digestContent('same');
        const matching = sample('good.png', 'same', {expectedImage: expected});
        expect(auditDatasetImageSamples([matching]).issues).toEqual([]);
        const wrongSize = {...matching, expectedImage: {...expected, bytes: expected.bytes + 1}};
        expect(auditDatasetImageSamples([wrongSize]).issues).toEqual(['Image integrity mismatch for train/good.png.']);
    });

    it('fails on missing files and empty datasets', () => {
        const missing = sample('missing.png', 'missing');
        rmSync(missing.imagePath);
        const audit = auditDatasetImageSamples([missing, sample('good.png', 'good')]);
        expect(audit.checked).toBe(1);
        expect(audit.issues[0]).toContain('Cannot read train/missing.png');
        expect(auditDatasetImageSamples([]).issues).toEqual(['No dataset images found to audit.']);
    });

    it('audits the current shard snapshot using actual bytes', () => {
        const datasetDir = resolve(fixture, 'out', 'dataset-ccss');
        const transaction = beginDatasetStoreTransaction(datasetDir, {fullDataset: true, generatorIds: ['angles']}, 'audit');
        const train = resolve(transaction.stagingDir, 'train');
        mkdirSync(resolve(train, 'angles'), {recursive: true});
        const rows = ['Addition', 'Subtraction'].map((label, index) => {
            const file_name = `angles/${index}.png`;
            writeFileSync(resolve(train, file_name), `image-${index}`);
            return {file_name, sample_key: `sample-${index}`, generator: 'angles', view: 'inversion', labels: [label], mode: 'question'};
        });
        writeFileSync(resolve(train, 'metadata.jsonl'), rows.map(row => JSON.stringify(row)).join('\n'));
        transaction.commit({});
        const snapshot = readDatasetSnapshot(datasetDir);
        expect(auditSnapshotImages(snapshot).duplicates).toEqual([]);
        // The stored digests differ; a corrupted copy must still be found by its actual bytes.
        writeFileSync(snapshot.imagePath('train', 'sample-1'), 'image-0');
        const audit = auditSnapshotImages(snapshot);
        expect(audit.checked).toBe(2);
        expect(audit.issues[0]).toContain('conflicting labels');
        expect(audit.issues).toContain('Image integrity mismatch for train/angles/1.png.');
    });

    it('audits compact union rows across both splits and ignores unreferenced files', () => {
        sample('train/a.png', 'same');
        sample('validation/b.png', 'same');
        sample('unreferenced.png', 'same');
        published([{file_name: 'a.png', labels: ['Addition'], solution: false}],
            [{file_name: 'b.png', labels: ['Subtraction'], solution: false}]);
        const audit = auditPublishedImages(fixture);
        expect(audit.checked).toBe(2);
        expect(audit.duplicates[0]).toMatchObject({labelConflict: true, crossSplit: true});
        expect(audit.issues[0]).toContain('validation/b.png');
    });

    it.each([
        null,
        {file_name: '', labels: [], solution: false},
        {file_name: 'a.png', labels: 'Addition', solution: false},
        {file_name: 'a.png', labels: [1], solution: false},
        {file_name: 'a.png', labels: []}
    ])('rejects malformed public metadata: %j', row => {
        published([row]);
        expect(() => auditPublishedImages(fixture)).toThrow('Invalid image metadata in train');
    });

    it('does not silently pass absent metadata', () => {
        expect(() => auditPublishedImages(fixture)).toThrow();
    });
});
