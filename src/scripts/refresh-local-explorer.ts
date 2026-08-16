import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAssetIndexBundle} from '../lib/asset-index-builder.ts';
import {
    pruneLocalExplorerSnapshots,
    publishLocalExplorerSnapshot,
} from '../lib/local-explorer-snapshot.ts';
import {
    buildCoverageManifest,
    buildCurrentStandardsCoverage,
    parseStandardsTree,
    resolveOntologyVersion,
} from '../lib/standards-coverage.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const snapshotRoot = resolve(projectRoot, 'temp', 'standards-explorer-preview');
const generatedAt = new Date().toISOString();
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf-8'));

// Keep stdout machine-readable even if shared loaders add informational logging.
console.log = (...args: unknown[]) => console.error(...args);

const tree = parseStandardsTree(readJson(resolve(projectRoot, 'public', 'coverage', 'ccss-tree.json')));
const ontologyVersion = resolveOntologyVersion(readJson(resolve(projectRoot, 'package.json')) as {
    dependencies?: Record<string, string>;
});
const assets = await buildAssetIndexBundle({
    projectRoot,
    repository: 'local',
    revision: 'working-tree',
});
const coverage = await buildCurrentStandardsCoverage({
    standardsMap: tree.standardsMap,
    ontologyVersion,
    generatedAt,
    knownAssets: assets.index,
});
const manifest = buildCoverageManifest({
    channel: 'preview',
    sourceRef: 'working-tree',
    sourceSha: 'working-tree',
    ontologyVersion,
    generatedAt,
});
const snapshot = publishLocalExplorerSnapshot(snapshotRoot, {
    tree,
    coverage,
    manifest,
    index: assets.index,
    localAssets: assets.localAssets,
}, generatedAt);
pruneLocalExplorerSnapshots(snapshotRoot);

process.stdout.write(JSON.stringify({
    schema_version: snapshot.schema_version,
    snapshot_id: snapshot.snapshot_id,
    generated_at: snapshot.generated_at,
    asset_count: snapshot.asset_count,
}));
