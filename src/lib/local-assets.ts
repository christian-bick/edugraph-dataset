import { extname } from 'node:path';

const LOCAL_DATASET_SPLITS = new Set(['train', 'validation']);

/** Decodes a local image request into the exact key held by the dynamic asset bundle. */
export function localAssetRequestKey(encodedPath: string): string | null {
    let requestPath: string;
    try {
        requestPath = decodeURIComponent(encodedPath);
    } catch {
        return null;
    }

    if (requestPath.includes('\\')) return null;
    const segments = requestPath.replace(/^\/+/, '').split('/');
    const [split] = segments;
    if (!LOCAL_DATASET_SPLITS.has(split)
        || segments.length < 3
        || segments.some(segment => !segment || segment === '.' || segment === '..')
        || extname(segments.at(-1) ?? '').toLowerCase() !== '.png') return null;
    return segments.join('/');
}
