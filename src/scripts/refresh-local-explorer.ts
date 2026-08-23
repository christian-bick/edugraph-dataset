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
} from '../lib/standards-coverage.ts';
import {
    publishCoverageInputObservation,
    resolveCurrentCoverageInputs
} from '../lib/coverage-observation.ts';
import {digestIdentity} from '../lib/content-identity.ts';
import {readCanonicalStandardsTree} from '../lib/standards-source.ts';
import {projectCoverageData, resolveCoverageCore} from '../lib/coverage-core.ts';
import {resolveOntologySemanticUsage} from '../lib/external-semantics.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const snapshotRoot = resolve(projectRoot, 'temp', 'standards-explorer-preview');
const coreCacheRoot = resolve(projectRoot, 'temp', 'coverage-core');
const generatedAt = new Date().toISOString();
const reportProgress = (message: string): void => {
    process.stdout.write(`${JSON.stringify({type: 'progress', message})}\n`);
};

// Keep stdout machine-readable even if shared loaders add informational logging.
console.log = (...args: unknown[]) => console.error(...args);

reportProgress('Loading canonical Common Core tree and ontology metadata…');
const sourceTree = readCanonicalStandardsTree(projectRoot);
reportProgress('Indexing generated samples and target labels…');
const assets = await buildAssetIndexBundle({
    projectRoot,
    repository: 'local',
    revision: 'working-tree',
});
const resolvedInputs = await resolveCurrentCoverageInputs({
    projectRoot,
    root: coreCacheRoot,
    sourceRef: 'working-tree',
    sourceSha: 'working-tree',
    knownAssetsSha256: digestIdentity(assets.index),
    ontologyUsageSha256: async () =>
        (await resolveOntologySemanticUsage(projectRoot, 'ccss')).usage.input_sha256
});
const inputs = resolvedInputs.inputs;
const ontologyVersion = inputs.ontology.version;
console.error(
    `[Coverage observation] ${resolvedInputs.reused_observation ? 'HIT' : 'MISS'}: `
    + resolvedInputs.reason
);
reportProgress('Resolving current standards coverage…');
const core = await resolveCoverageCore({
    root: coreCacheRoot,
    inputs,
    build: async () => ({
        tree: sourceTree,
        coverage: await buildCurrentStandardsCoverage({
            standardsMap: sourceTree.standardsMap,
            ontologyVersion,
            generatedAt,
            knownAssets: assets.index,
        })
    })
});
publishCoverageInputObservation(coreCacheRoot, resolvedInputs.observation);
console.error(`[Coverage core] ${core.reused ? 'HIT' : 'MISS'} ${core.artifact.core_input_key}`);
const tree = core.artifact.tree;
const coverage = projectCoverageData(core.artifact.coverage, generatedAt, ontologyVersion);
const manifest = buildCoverageManifest({
    channel: 'preview',
    inputs,
    generatedAt,
});
reportProgress('Publishing the immutable local snapshot…');
const snapshot = publishLocalExplorerSnapshot(snapshotRoot, {
    tree,
    coverage,
    manifest,
    index: assets.index,
    localAssets: assets.localAssets,
}, generatedAt);
reportProgress('Cleaning superseded local snapshots…');
pruneLocalExplorerSnapshots(snapshotRoot);

process.stdout.write(`${JSON.stringify({
    type: 'result',
    schema_version: snapshot.schema_version,
    snapshot_id: snapshot.snapshot_id,
    generated_at: snapshot.generated_at,
    asset_count: snapshot.asset_count,
    asset_blobs_written: snapshot.asset_blobs_written,
    asset_blobs_reused: snapshot.asset_blobs_reused,
    asset_links_created: snapshot.asset_links_created,
    asset_bytes_written: snapshot.asset_bytes_written,
})}\n`);
