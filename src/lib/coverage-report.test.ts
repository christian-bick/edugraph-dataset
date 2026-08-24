import {appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {readCoverageEntries} from './coverage-report.ts';
import {beginDatasetStoreTransaction} from './dataset-store.ts';

function row(sampleKey: string, generator: string, label: string) {
    return {
        file_name: `${generator}/${sampleKey}.png`,
        sample_key: sampleKey,
        generator,
        view: 'view',
        labels: [label]
    };
}

describe('readCoverageEntries', () => {
    it('reads the flat train and validation metadata of the published union', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-union-coverage-'));
        try {
            for (const split of ['train', 'validation']) {
                mkdirSync(resolve(root, split), {recursive: true});
            }
            writeFileSync(
                resolve(root, 'train', 'metadata.jsonl'),
                `${JSON.stringify(row('train-sample', 'train-gen', 'Area.Train'))}\n`
            );
            writeFileSync(
                resolve(root, 'validation', 'metadata.jsonl'),
                `${JSON.stringify(row('val-sample', 'val-gen', 'Area.Validation'))}\n`
            );

            expect(readCoverageEntries(root, true).map(entry => entry.sample_key)).toEqual([
                'train-sample',
                'val-sample'
            ]);
            expect(() => readCoverageEntries(root, false)).toThrow('has no current.json pointer');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('reads a standard dataset through its transactional snapshot', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-standard-coverage-'));
        try {
            const transaction = beginDatasetStoreTransaction(root, {
                fullDataset: true,
                generatorIds: ['standard-gen']
            }, 'standard');
            const moduleDir = resolve(transaction.stagingDir, 'train', 'standard-gen');
            mkdirSync(moduleDir, {recursive: true});
            writeFileSync(resolve(moduleDir, 'sample.png'), 'image');
            appendFileSync(
                resolve(transaction.stagingDir, 'train', 'metadata.jsonl'),
                `${JSON.stringify(row('sample', 'standard-gen', 'Area.Standard'))}\n`
            );
            transaction.commit({schema_version: 8});

            expect(readCoverageEntries(root, false)).toEqual([
                expect.objectContaining({sample_key: 'sample', labels: ['Area.Standard']})
            ]);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
