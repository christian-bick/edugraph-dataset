import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAssetIndexBundle} from '../lib/asset-index-builder.ts';
import {
    buildCoverageManifest,
    buildCurrentStandardsCoverage,
    parseStandardsTree,
    resolveOntologyVersion
} from '../lib/standards-coverage.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf-8'));
const tree = parseStandardsTree(readJson(resolve(projectRoot, 'public', 'coverage', 'ccss-tree.json')));
const ontologyVersion = resolveOntologyVersion(readJson(resolve(projectRoot, 'package.json')) as {
    dependencies?: Record<string, string>;
});
const generatedAt = new Date().toISOString();

// Keep stdout machine-readable even if shared loaders add informational logging.
console.log = (...args: unknown[]) => console.error(...args);

const knownAssets = await buildAssetIndexBundle({
    projectRoot,
    repository: 'local',
    revision: 'working-tree'
}).then(bundle => bundle.index).catch(error => {
    console.error('[Coverage] Local generated metadata is unavailable; probing generator paths directly.');
    if (error instanceof Error) console.error(error.message);
    return undefined;
});
const coverage = await buildCurrentStandardsCoverage({
    standardsMap: tree.standardsMap,
    ontologyVersion,
    generatedAt,
    knownAssets
});
const manifest = buildCoverageManifest({
    channel: 'preview',
    sourceRef: 'working-tree',
    sourceSha: 'working-tree',
    ontologyVersion,
    generatedAt
});

process.stdout.write(JSON.stringify({tree, coverage, manifest}));
