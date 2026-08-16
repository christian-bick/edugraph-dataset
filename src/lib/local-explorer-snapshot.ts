import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import type {AssetIndex} from './asset-index.ts';
import {localAssetRequestKey} from './local-assets.ts';

export const LOCAL_EXPLORER_SNAPSHOT_SCHEMA_VERSION = 1;

export interface LocalExplorerSnapshotInfo {
    schema_version: number;
    snapshot_id: string;
    generated_at: string;
    asset_count: number;
    directory: string;
}

export interface LocalExplorerSnapshotPayload {
    tree: unknown;
    coverage: unknown;
    manifest: unknown;
    index: AssetIndex;
    localAssets: ReadonlyMap<string, string>;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

function snapshotId(generatedAt: string): string {
    return `${generatedAt.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
}

function writeSnapshotJson(snapshotDir: string, path: string, value: unknown): void {
    const outputPath = resolve(snapshotDir, path);
    mkdirSync(dirname(outputPath), {recursive: true});
    writeFileSync(outputPath, json(value), 'utf-8');
}

export function publishLocalExplorerSnapshot(
    snapshotRoot: string,
    payload: LocalExplorerSnapshotPayload,
    generatedAt = new Date().toISOString(),
): LocalExplorerSnapshotInfo {
    const id = snapshotId(generatedAt);
    const directory = resolve(snapshotRoot, id);
    mkdirSync(directory, {recursive: true});

    try {
        writeSnapshotJson(directory, 'coverage/ccss-tree.json', payload.tree);
        writeSnapshotJson(directory, 'coverage/ccss-coverage.json', payload.coverage);
        writeSnapshotJson(directory, 'coverage/coverage-manifest.json', payload.manifest);
        writeSnapshotJson(directory, 'dataset/local-asset-index.json', payload.index);

        for (const [key, sourcePath] of payload.localAssets) {
            const normalizedKey = localAssetRequestKey(key);
            if (!normalizedKey || normalizedKey !== key.replaceAll('\\', '/')) {
                throw new Error(`Invalid local explorer asset key: ${key}.`);
            }
            if (!existsSync(sourcePath)) {
                throw new Error(`Local explorer source asset is missing: ${sourcePath}.`);
            }
            const destination = resolve(directory, 'dataset', 'local', ...normalizedKey.split('/'));
            mkdirSync(dirname(destination), {recursive: true});
            copyFileSync(sourcePath, destination);
        }

        const info: LocalExplorerSnapshotInfo = {
            schema_version: LOCAL_EXPLORER_SNAPSHOT_SCHEMA_VERSION,
            snapshot_id: id,
            generated_at: generatedAt,
            asset_count: payload.localAssets.size,
            directory,
        };
        writeSnapshotJson(directory, 'snapshot.json', {
            schema_version: info.schema_version,
            snapshot_id: info.snapshot_id,
            generated_at: info.generated_at,
            asset_count: info.asset_count,
        });
        return info;
    } catch (error) {
        rmSync(directory, {recursive: true, force: true});
        throw error;
    }
}

function listLocalExplorerSnapshots(snapshotRoot: string): LocalExplorerSnapshotInfo[] {
    if (!existsSync(snapshotRoot)) return [];

    return readdirSync(snapshotRoot, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const directory = resolve(snapshotRoot, entry.name);
            const manifestPath = resolve(directory, 'snapshot.json');
            if (!existsSync(manifestPath)) return [];
            try {
                const value = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Partial<LocalExplorerSnapshotInfo>;
                if (value.schema_version !== LOCAL_EXPLORER_SNAPSHOT_SCHEMA_VERSION
                    || value.snapshot_id !== entry.name
                    || typeof value.generated_at !== 'string'
                    || typeof value.asset_count !== 'number') return [];
                return [{
                    schema_version: value.schema_version,
                    snapshot_id: value.snapshot_id,
                    generated_at: value.generated_at,
                    asset_count: value.asset_count,
                    directory,
                }];
            } catch {
                return [];
            }
        })
        .sort((left, right) => right.generated_at.localeCompare(left.generated_at));
}

export function readLatestLocalExplorerSnapshot(snapshotRoot: string): LocalExplorerSnapshotInfo | null {
    return listLocalExplorerSnapshots(snapshotRoot)[0] ?? null;
}

export function pruneLocalExplorerSnapshots(snapshotRoot: string, retain = 2): void {
    if (!Number.isInteger(retain) || retain < 1) throw new Error('Snapshot retention must be a positive integer.');
    for (const snapshot of listLocalExplorerSnapshots(snapshotRoot).slice(retain)) {
        try {
            rmSync(snapshot.directory, {recursive: true, force: true});
        } catch {
            // An old snapshot may still have a response stream open on Windows.
            // It is safe to retain and retry cleanup after a later refresh.
        }
    }
}
