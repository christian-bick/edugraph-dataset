import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAssetIndexBundle } from '../lib/asset-index-builder.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Keep stdout machine-readable even if shared loaders add informational logging.
console.log = (...args: unknown[]) => console.error(...args);

const bundle = await buildAssetIndexBundle({
    projectRoot,
    repository: 'local',
    revision: 'working-tree',
});

process.stdout.write(JSON.stringify({
    index: bundle.index,
    localAssets: [...bundle.localAssets],
}));
