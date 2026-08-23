import {
    copyFileSync,
    existsSync,
    linkSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import type {AssetIndex} from './asset-index.ts';
import {localAssetRequestKey} from './local-assets.ts';
import {digestFile, radixSortUtf8} from './content-identity.ts';

export const LOCAL_EXPLORER_SNAPSHOT_SCHEMA_VERSION = 2;

export interface LocalExplorerSnapshotInfo {
    schema_version: number;
    snapshot_id: string;
    generated_at: string;
    asset_count: number;
    asset_blobs_written: number;
    asset_blobs_reused: number;
    asset_links_created: number;
    asset_bytes_written: number;
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
    const assetPool = resolve(snapshotRoot, '.assets');
    mkdirSync(directory, {recursive: true});
    let assetBlobsWritten = 0;
    let assetBlobsReused = 0;
    let assetLinksCreated = 0;
    let assetBytesWritten = 0;

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
            const identity = digestFile(sourcePath);
            const blob = resolve(assetPool, identity.sha256);
            mkdirSync(assetPool, {recursive: true});
            if (!existsSync(blob)) {
                const stagedBlob = resolve(assetPool, `.${identity.sha256}.${process.pid}.${randomUUID()}`);
                copyFileSync(sourcePath, stagedBlob);
                try {
                    renameSync(stagedBlob, blob);
                    assetBlobsWritten++;
                    assetBytesWritten += identity.bytes;
                } catch (error) {
                    if (!existsSync(blob)) throw error;
                    assetBlobsReused++;
                } finally {
                    rmSync(stagedBlob, {force: true});
                }
            } else {
                if (statSync(blob).size !== identity.bytes) {
                    throw new Error(`Local explorer asset blob is corrupt: ${identity.sha256}.`);
                }
                assetBlobsReused++;
            }
            const destination = resolve(directory, 'dataset', 'local', ...normalizedKey.split('/'));
            mkdirSync(dirname(destination), {recursive: true});
            try {
                linkSync(blob, destination);
                assetLinksCreated++;
            } catch {
                copyFileSync(blob, destination);
                assetBytesWritten += identity.bytes;
            }
        }

        const info: LocalExplorerSnapshotInfo = {
            schema_version: LOCAL_EXPLORER_SNAPSHOT_SCHEMA_VERSION,
            snapshot_id: id,
            generated_at: generatedAt,
            asset_count: payload.localAssets.size,
            asset_blobs_written: assetBlobsWritten,
            asset_blobs_reused: assetBlobsReused,
            asset_links_created: assetLinksCreated,
            asset_bytes_written: assetBytesWritten,
            directory,
        };
        writeSnapshotJson(directory, 'snapshot.json', {
            schema_version: info.schema_version,
            snapshot_id: info.snapshot_id,
            generated_at: info.generated_at,
            asset_count: info.asset_count,
            asset_blobs_written: info.asset_blobs_written,
            asset_blobs_reused: info.asset_blobs_reused,
            asset_links_created: info.asset_links_created,
            asset_bytes_written: info.asset_bytes_written,
        });
        return info;
    } catch (error) {
        rmSync(directory, {recursive: true, force: true});
        throw error;
    }
}

function listLocalExplorerSnapshots(snapshotRoot: string): LocalExplorerSnapshotInfo[] {
    if (!existsSync(snapshotRoot)) return [];

    const snapshots = readdirSync(snapshotRoot, {withFileTypes: true})
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
                    || typeof value.asset_count !== 'number'
                    || typeof value.asset_blobs_written !== 'number'
                    || typeof value.asset_blobs_reused !== 'number'
                    || typeof value.asset_links_created !== 'number'
                    || typeof value.asset_bytes_written !== 'number') return [];
                return [{
                    schema_version: value.schema_version,
                    snapshot_id: value.snapshot_id,
                    generated_at: value.generated_at,
                    asset_count: value.asset_count,
                    asset_blobs_written: value.asset_blobs_written,
                    asset_blobs_reused: value.asset_blobs_reused,
                    asset_links_created: value.asset_links_created,
                    asset_bytes_written: value.asset_bytes_written,
                    directory,
                }];
            } catch {
                return [];
            }
        });
    const byTime = new Map(snapshots.map(snapshot => [
        `${snapshot.generated_at}\0${snapshot.snapshot_id}`,
        snapshot
    ]));
    return radixSortUtf8([...byTime.keys()]).reverse().map(key => byTime.get(key)!);
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
