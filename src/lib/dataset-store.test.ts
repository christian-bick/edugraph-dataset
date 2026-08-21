import {describe, expect, it} from 'vitest';
import {appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {
    beginDatasetStoreTransaction,
    readDatasetSnapshot,
    verifyDatasetSnapshotIntegrity
} from './dataset-store.ts';

function writeSelected(
    stagingDir: string,
    generator: string,
    view: string,
    sample: string,
    content: string
): void {
    const moduleDir = resolve(stagingDir, 'train', generator);
    mkdirSync(moduleDir, {recursive: true});
    const fileName = `${sample}.png`;
    const row = {
        file_name: `${generator}/${fileName}`,
        sample_key: sample,
        generator,
        view
    };
    writeFileSync(resolve(moduleDir, fileName), content);
    appendFileSync(resolve(stagingDir, 'train', 'metadata.jsonl'), `${JSON.stringify(row)}\n`);
}

describe('dataset store', () => {
    it('publishes an immutable full generation behind a pointer', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        const transaction = beginDatasetStoreTransaction(datasetDir, {
            fullDataset: true,
            generatorIds: ['one']
        }, 'full');
        writeSelected(transaction.stagingDir, 'one', 'view-a', 'sample-a', 'image-a');

        try {
            const candidate = transaction.prepare();
            expect(candidate.rows('train')).toHaveLength(1);
            expect(readFileSync(candidate.imagePath('train', 'sample-a'), 'utf-8')).toBe('image-a');
            transaction.commit({schema_version: 3});

            expect(existsSync(resolve(datasetDir, 'current.json'))).toBe(true);
            expect(existsSync(resolve(datasetDir, 'train'))).toBe(false);
            const published = readDatasetSnapshot(datasetDir);
            expect(published.generationId).toMatch(/^[a-f\d]{64}$/);
            expect(published.buildManifest).toEqual({schema_version: 3});
            expect(published.rows('train')[0].sample_key).toBe('sample-a');
            expect(verifyDatasetSnapshotIntegrity(published)).toEqual({
                files_verified: 1,
                bytes_read: 7,
                issues: []
            });
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('reuses an unchanged shard and replaces only a selected pair', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-delta-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        try {
            const first = beginDatasetStoreTransaction(datasetDir, {
                fullDataset: true,
                generatorIds: ['one']
            }, 'first');
            writeSelected(first.stagingDir, 'one', 'view-a', 'sample-a', 'image-a');
            first.commit({version: 1});
            const firstSnapshot = readDatasetSnapshot(datasetDir);
            const retainedKey = Object.values(firstSnapshot.shardReferences)[0].key;

            const second = beginDatasetStoreTransaction(datasetDir, {
                fullDataset: false,
                generatorIds: ['two'],
                viewIds: ['view-b']
            }, 'second');
            writeSelected(second.stagingDir, 'two', 'view-b', 'sample-b', 'image-b');
            const candidate = second.prepare();
            expect(candidate.rows('train').map(row => row.sample_key)).toEqual(['sample-a', 'sample-b']);
            expect(Object.values(candidate.shardReferences).some(ref => ref.key === retainedKey)).toBe(true);
            second.commit({version: 2});

            const published = readDatasetSnapshot(datasetDir);
            expect(published.rows('train').map(row => row.sample_key)).toEqual(['sample-a', 'sample-b']);
            expect(second.stats()).toMatchObject({shards_written: 1, shards_reused: 1});
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('replaces an exact pair without selecting sibling views of the same generator', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-pair-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        try {
            const first = beginDatasetStoreTransaction(datasetDir, {
                fullDataset: true,
                generatorIds: ['one']
            }, 'pair-first');
            writeSelected(first.stagingDir, 'one', 'view-a', 'sample-a', 'image-a');
            writeSelected(first.stagingDir, 'one', 'view-b', 'sample-b', 'image-b');
            first.commit({version: 1});

            const second = beginDatasetStoreTransaction(datasetDir, {
                fullDataset: false,
                generatorIds: ['one'],
                pairKeys: ['one#view-a']
            }, 'pair-second');
            writeSelected(second.stagingDir, 'one', 'view-a', 'sample-a2', 'image-a2');
            second.commit({version: 2});

            expect(readDatasetSnapshot(datasetDir).rows('train').map(row => row.sample_key)).toEqual([
                'sample-a2',
                'sample-b'
            ]);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('reuses the exact immutable generation for identical content and manifests', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-idempotent-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        try {
            const publish = (id: string) => {
                const transaction = beginDatasetStoreTransaction(datasetDir, {
                    fullDataset: true,
                    generatorIds: ['one']
                }, id);
                writeSelected(transaction.stagingDir, 'one', 'view-a', 'sample-a', 'image-a');
                transaction.commit({version: 1});
                return readDatasetSnapshot(datasetDir).generationId;
            };

            expect(publish('second')).toBe(publish('first'));
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('reports corrupt live image bytes without trusting the pointer alone', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-corrupt-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        try {
            const transaction = beginDatasetStoreTransaction(datasetDir, {
                fullDataset: true,
                generatorIds: ['one']
            }, 'corrupt');
            writeSelected(transaction.stagingDir, 'one', 'view-a', 'sample-a', 'image-a');
            transaction.commit({version: 1});
            const snapshot = readDatasetSnapshot(datasetDir);
            writeFileSync(snapshot.imagePath('train', 'sample-a'), 'damaged');
            expect(verifyDatasetSnapshotIntegrity(snapshot).issues).toEqual([
                'Image integrity mismatch for sample-a.'
            ]);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('retains a legacy dataset as a readable migration source', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-store-legacy-'));
        const datasetDir = resolve(root, 'out', 'dataset-test');
        mkdirSync(resolve(datasetDir, 'train', 'one'), {recursive: true});
        const row = {file_name: 'one/sample.png', sample_key: 'legacy', generator: 'one', view: 'view'};
        writeFileSync(resolve(datasetDir, 'train', 'metadata.jsonl'), `${JSON.stringify(row)}\n`);
        writeFileSync(resolve(datasetDir, 'train', 'one', 'sample.png'), 'legacy-image');
        writeFileSync(resolve(datasetDir, 'manifest.json'), JSON.stringify({schema_version: 2}));
        try {
            const snapshot = readDatasetSnapshot(datasetDir);
            expect(snapshot.generationId).toBeNull();
            expect(snapshot.rows('train')).toEqual([row]);
            expect(readFileSync(snapshot.imagePath('train', 'legacy'), 'utf-8')).toBe('legacy-image');
            expect(snapshot.buildManifest).toEqual({schema_version: 2});
            expect(() => beginDatasetStoreTransaction(datasetDir, {
                fullDataset: false,
                generatorIds: ['one']
            }, 'unsafe-scope')).toThrow('must be migrated with one full generation');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
