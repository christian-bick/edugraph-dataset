import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import type {AssetIndex} from './asset-index.ts';
import {
    publishLocalExplorerSnapshot,
    pruneLocalExplorerSnapshots,
    readLatestLocalExplorerSnapshot,
} from './local-explorer-snapshot.ts';

const roots: string[] = [];

function fixtureRoot(): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-local-explorer-'));
    roots.push(root);
    return root;
}

const index: AssetIndex = {
    schema_version: 1,
    generated_at: '2026-08-16T12:00:00.000Z',
    dataset: {repository: 'local', revision: 'working-tree'},
    label_sets: [],
};

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('local explorer snapshots', () => {
    it('publishes complete immutable data and resolves the newest snapshot', () => {
        const root = fixtureRoot();
        const source = resolve(root, 'source.png');
        writeFileSync(source, 'png');
        const payload = {
            tree: {tree: {}},
            coverage: {coverage: {}},
            manifest: {channel: 'preview'},
            index,
            localAssets: new Map([['train/writing/sample.png', source]]),
        };

        const first = publishLocalExplorerSnapshot(
            resolve(root, 'snapshots'),
            payload,
            '2026-08-16T12:00:00.000Z',
        );
        const second = publishLocalExplorerSnapshot(
            resolve(root, 'snapshots'),
            payload,
            '2026-08-16T12:01:00.000Z',
        );
        const third = publishLocalExplorerSnapshot(
            resolve(root, 'snapshots'),
            payload,
            '2026-08-16T12:02:00.000Z',
        );
        pruneLocalExplorerSnapshots(resolve(root, 'snapshots'), 2);

        expect(existsSync(first.directory)).toBe(false);
        expect(existsSync(second.directory)).toBe(true);
        expect(readLatestLocalExplorerSnapshot(resolve(root, 'snapshots'))).toMatchObject({
            snapshot_id: third.snapshot_id,
            asset_count: 1,
        });
        expect(readFileSync(resolve(third.directory, 'dataset/local/train/writing/sample.png'), 'utf-8'))
            .toBe('png');
        expect(JSON.parse(readFileSync(resolve(third.directory, 'coverage/ccss-coverage.json'), 'utf-8')))
            .toEqual({coverage: {}});
    });

    it('rejects unsafe asset keys and removes the incomplete snapshot', () => {
        const root = fixtureRoot();
        const source = resolve(root, 'source.png');
        writeFileSync(source, 'png');
        const snapshotRoot = resolve(root, 'snapshots');
        mkdirSync(snapshotRoot, {recursive: true});

        expect(() => publishLocalExplorerSnapshot(snapshotRoot, {
            tree: {},
            coverage: {},
            manifest: {},
            index,
            localAssets: new Map([['train/../sample.png', source]]),
        })).toThrow('Invalid local explorer asset key');
        expect(readLatestLocalExplorerSnapshot(snapshotRoot)).toBeNull();
    });
});
