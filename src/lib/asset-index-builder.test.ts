import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import {dirname, resolve} from 'node:path';
import { buildAssetIndexBundle } from './asset-index-builder.ts';
import { targetLookupKey } from './asset-index.ts';
import {beginDatasetStoreTransaction, readDatasetSnapshot} from './dataset-store.ts';

function publishDataset(
    projectRoot: string,
    spec: string,
    row: Record<string, unknown>,
    imageContents = 'png'
): void {
    const datasetDir = resolve(projectRoot, 'out', `dataset-${spec}`);
    const transaction = beginDatasetStoreTransaction(datasetDir, {
        fullDataset: true,
        generatorIds: [String(row.generator)]
    }, `fixture-${spec}`);
    const imagePath = resolve(transaction.stagingDir, 'train', String(row.file_name));
    mkdirSync(dirname(imagePath), {recursive: true});
    writeFileSync(imagePath, imageContents);
    writeFileSync(
        resolve(transaction.stagingDir, 'train', 'metadata.jsonl'),
        `${JSON.stringify(row)}\n`
    );
    transaction.commit(null);
}

describe('buildAssetIndexBundle', () => {
    let projectRoot: string;

    beforeEach(() => {
        mkdirSync('temp', { recursive: true });
        projectRoot = mkdtempSync(resolve('temp', 'asset-index-builder-'));
        publishDataset(projectRoot, 'ccss', {
            file_name: 'counting/sample.png',
            sample_key: 'target#generator#view#train#question#inst:0',
            spec: 'ccss',
            target_id: 'target',
            generator: 'generator',
            view: 'view',
            mode: 'question',
            instance: 0,
            content_fingerprint: 'fingerprint',
            task_fingerprint: 'task',
            tags: ['Counting'],
        });
    });

    afterEach(() => rmSync(projectRoot, { recursive: true, force: true }));

    it('builds a local index directly from generated standard datasets', async () => {
        const bundle = await buildAssetIndexBundle({
            projectRoot,
            repository: 'local',
            revision: 'working-tree',
            specNames: ['ccss'],
            targetLabels: new Map([[targetLookupKey('ccss', 'target'), ['Counting']]]),
        });

        expect(bundle.index.label_sets[0].samples[0].file_name).toBe('counting/sample.png');
        expect(bundle.localAssets.get('train/counting/sample.png')).toBe(
            readDatasetSnapshot(resolve(projectRoot, 'out', 'dataset-ccss'))
                .imagePath('train', 'target#generator#view#train#question#inst:0'),
        );
    });

    it('preserves target evidence when the union reuses an earlier physical sample', async () => {
        publishDataset(projectRoot, 'nctm', {
            file_name: 'counting/duplicate.png',
            sample_key: 'other#generator#view#train#question#inst:0',
            spec: 'nctm',
            target_id: 'other',
            generator: 'generator',
            view: 'view',
            mode: 'question',
            instance: 0,
            content_fingerprint: 'fingerprint',
            task_fingerprint: 'task',
            tags: ['Addition', 'Counting'],
        });

        const bundle = await buildAssetIndexBundle({
            projectRoot,
            repository: 'local',
            revision: 'working-tree',
            specNames: ['ccss', 'nctm'],
            targetLabels: new Map([
                [targetLookupKey('ccss', 'target'), ['Counting']],
                [targetLookupKey('nctm', 'other'), ['Addition', 'Counting']],
            ]),
        });

        expect(bundle.index.label_sets).toHaveLength(2);
        expect(bundle.index.label_sets.flatMap(group => group.samples.map(sample => sample.file_name)))
            .toEqual(['counting/sample.png', 'counting/sample.png']);
    });

    it('retains the same data as separate samples when resolved view tasks differ', async () => {
        publishDataset(projectRoot, 'nctm', {
            file_name: 'counting/composition.png',
            sample_key: 'composition#generator#view#train#question#inst:0',
            spec: 'nctm',
            target_id: 'composition',
            generator: 'generator',
            view: 'view',
            mode: 'question',
            instance: 0,
            content_fingerprint: 'fingerprint',
            task_fingerprint: 'composition-task',
            tags: ['Composition'],
        });

        const bundle = await buildAssetIndexBundle({
            projectRoot,
            repository: 'local',
            revision: 'working-tree',
            specNames: ['ccss', 'nctm'],
            targetLabels: new Map([
                [targetLookupKey('ccss', 'target'), ['Counting']],
                [targetLookupKey('nctm', 'composition'), ['Composition']],
            ]),
        });

        expect(bundle.index.label_sets.flatMap(group => group.samples.map(sample => sample.file_name)).sort())
            .toEqual(['counting/composition.png', 'counting/sample.png']);
    });

    it('requires the merged image only for release-index generation', async () => {
        const options = {
            projectRoot,
            repository: 'owner/dataset',
            revision: 'v1',
            requireMergedUnion: true,
            specNames: ['ccss'],
            targetLabels: new Map([[targetLookupKey('ccss', 'target'), ['Counting']]]),
        };
        await expect(buildAssetIndexBundle(options)).rejects.toThrow(/Merged union dataset not found/);

        const unionModuleDir = resolve(projectRoot, 'out', 'dataset', 'train', 'counting');
        mkdirSync(unionModuleDir, { recursive: true });
        writeFileSync(resolve(unionModuleDir, 'sample.png'), 'png');

        await expect(buildAssetIndexBundle(options)).resolves.toMatchObject({
            index: { dataset: { repository: 'owner/dataset', revision: 'v1' } },
        });
    });
});
