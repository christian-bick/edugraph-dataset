import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAssetIndexBundle } from './asset-index-builder.ts';
import { targetLookupKey } from './asset-index.ts';

describe('buildAssetIndexBundle', () => {
    let projectRoot: string;

    beforeEach(() => {
        mkdirSync('temp', { recursive: true });
        projectRoot = mkdtempSync(resolve('temp', 'asset-index-builder-'));
        const moduleDir = resolve(projectRoot, 'out', 'dataset-ccss', 'train', 'counting');
        mkdirSync(moduleDir, { recursive: true });
        writeFileSync(resolve(moduleDir, 'sample.png'), 'png');
        writeFileSync(resolve(moduleDir, '.metadata.jsonl'), `${JSON.stringify({
            file_name: 'sample.png',
            sample_key: 'target#generator#view#train#question#inst:0',
            spec: 'ccss',
            target_id: 'target',
            generator: 'generator',
            view: 'view',
            mode: 'question',
            instance: 0,
            content_fingerprint: 'fingerprint',
            tags: ['Counting'],
        })}\n`);
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
            resolve(projectRoot, 'out', 'dataset-ccss', 'train', 'counting', 'sample.png'),
        );
    });

    it('preserves target evidence when the union reuses an earlier physical sample', async () => {
        const moduleDir = resolve(projectRoot, 'out', 'dataset-nctm', 'train', 'counting');
        mkdirSync(moduleDir, { recursive: true });
        writeFileSync(resolve(moduleDir, 'duplicate.png'), 'png');
        writeFileSync(resolve(moduleDir, '.metadata.jsonl'), `${JSON.stringify({
            file_name: 'duplicate.png',
            sample_key: 'other#generator#view#train#question#inst:0',
            spec: 'nctm',
            target_id: 'other',
            generator: 'generator',
            view: 'view',
            mode: 'question',
            instance: 0,
            content_fingerprint: 'fingerprint',
            tags: ['Addition', 'Counting'],
        })}\n`);

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
        const moduleDir = resolve(projectRoot, 'out', 'dataset-nctm', 'train', 'counting');
        mkdirSync(moduleDir, { recursive: true });
        writeFileSync(resolve(moduleDir, 'composition.png'), 'png');
        writeFileSync(resolve(moduleDir, '.metadata.jsonl'), `${JSON.stringify({
            file_name: 'composition.png',
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
        })}\n`);

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
