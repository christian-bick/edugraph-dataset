import { extname, isAbsolute, relative, resolve, sep } from 'node:path';

const LOCAL_DATASET_SPLITS = new Set(['train', 'validation']);

/** Resolves an encoded local-dataset request without allowing it outside the union dataset root. */
export function resolveLocalDatasetAsset(
    datasetRoot: string,
    encodedPath: string,
): string | null {
    let requestPath: string;
    try {
        requestPath = decodeURIComponent(encodedPath);
    } catch {
        return null;
    }

    const candidate = resolve(datasetRoot, requestPath.replace(/^[/\\]+/, ''));
    const relativePath = relative(datasetRoot, candidate);
    if (!relativePath
        || relativePath === '..'
        || relativePath.startsWith(`..${sep}`)
        || isAbsolute(relativePath)
        || extname(relativePath).toLowerCase() !== '.png') {
        return null;
    }

    const [split] = relativePath.split(sep);
    return LOCAL_DATASET_SPLITS.has(split) ? candidate : null;
}
