import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import {
    beginDatasetTransaction,
    finalizeDatasetMetadata,
    mergeModuleMetadata
} from './dataset-output.ts';

const roots: string[] = [];

function fixtureRoot(): string {
    const root = resolve(tmpdir(), `edugraph-dataset-output-${process.pid}-${roots.length}`);
    roots.push(root);
    mkdirSync(root, { recursive: true });
    return root;
}

function writeRows(path: string, rows: unknown[]): void {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, `${rows.map(row => JSON.stringify(row)).join('\n')}\n`);
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('dataset output transactions', () => {
    it('preserves the live dataset when a transaction rolls back', () => {
        const root = fixtureRoot();
        const datasetDir = resolve(root, 'dataset-test');
        mkdirSync(datasetDir, { recursive: true });
        writeFileSync(resolve(datasetDir, 'sentinel.txt'), 'original');

        const tx = beginDatasetTransaction(datasetDir, {
            fullDataset: true,
            generatorIds: []
        }, 'rollback');
        writeFileSync(resolve(tx.stagingDir, 'sentinel.txt'), 'replacement');
        tx.rollback();

        expect(readFileSync(resolve(datasetDir, 'sentinel.txt'), 'utf-8')).toBe('original');
        expect(existsSync(tx.stagingDir)).toBe(false);
    });

    it('atomically commits a complete replacement', () => {
        const root = fixtureRoot();
        const datasetDir = resolve(root, 'dataset-test');
        mkdirSync(datasetDir, { recursive: true });
        writeFileSync(resolve(datasetDir, 'old.txt'), 'old');

        const tx = beginDatasetTransaction(datasetDir, {
            fullDataset: true,
            generatorIds: []
        }, 'commit');
        writeFileSync(resolve(tx.stagingDir, 'new.txt'), 'new');
        tx.commit();

        expect(existsSync(resolve(datasetDir, 'old.txt'))).toBe(false);
        expect(readFileSync(resolve(datasetDir, 'new.txt'), 'utf-8')).toBe('new');
    });

    it('removes only selected views from a scoped generator copy', () => {
        const root = fixtureRoot();
        const datasetDir = resolve(root, 'dataset-test');
        const moduleDir = resolve(datasetDir, 'train', 'writing');
        mkdirSync(moduleDir, { recursive: true });
        writeFileSync(resolve(datasetDir, 'validation-report.md'), 'stale');
        mkdirSync(resolve(datasetDir, 'validation-reports'), { recursive: true });
        writeFileSync(resolve(datasetDir, 'validation-reports', 'generator=writing.md'), 'stale');
        writeFileSync(resolve(moduleDir, 'standard.png'), 'standard');
        writeFileSync(resolve(moduleDir, 'stroke.png'), 'stroke');
        writeRows(resolve(moduleDir, '.metadata.jsonl'), [
            { file_name: 'standard.png', sample_key: 'standard', generator: 'writing', view: 'numbers-write-standard' },
            { file_name: 'stroke.png', sample_key: 'stroke', generator: 'writing', view: 'numbers-write-stroke' }
        ]);

        const tx = beginDatasetTransaction(datasetDir, {
            fullDataset: false,
            generatorIds: ['writing'],
            viewIds: ['numbers-write-standard']
        }, 'view');

        const stagedModule = resolve(tx.stagingDir, 'train', 'writing');
        expect(existsSync(resolve(stagedModule, 'standard.png'))).toBe(false);
        expect(existsSync(resolve(stagedModule, 'stroke.png'))).toBe(true);
        expect(readFileSync(resolve(stagedModule, '.metadata.jsonl'), 'utf-8')).toContain('numbers-write-stroke');
        expect(readFileSync(resolve(stagedModule, '.metadata.jsonl'), 'utf-8')).not.toContain('numbers-write-standard');
        expect(existsSync(resolve(tx.stagingDir, 'validation-report.md'))).toBe(false);
        expect(existsSync(resolve(tx.stagingDir, 'validation-reports'))).toBe(false);
        tx.rollback();
    });
});

describe('metadata writing', () => {
    it('merges regenerated rows with preserved rows and rebuilds root metadata', () => {
        const root = fixtureRoot();
        const moduleDir = resolve(root, 'train', 'writing');
        writeRows(resolve(moduleDir, '.metadata.jsonl'), [
            { file_name: 'stroke.png', sample_key: 'stroke', generator: 'writing', view: 'numbers-write-stroke' }
        ]);

        mergeModuleMetadata(moduleDir, [
            { file_name: 'standard.png', sample_key: 'standard', generator: 'writing', view: 'numbers-write-standard' }
        ]);
        finalizeDatasetMetadata(root, 'train');

        const moduleMetadata = readFileSync(resolve(moduleDir, '.metadata.jsonl'), 'utf-8');
        expect(moduleMetadata).toContain('standard.png');
        expect(moduleMetadata).toContain('stroke.png');
        const rootMetadata = readFileSync(resolve(root, 'train', 'metadata.jsonl'), 'utf-8');
        expect(rootMetadata).toContain('writing/standard.png');
        expect(rootMetadata).toContain('writing/stroke.png');
    });
});
