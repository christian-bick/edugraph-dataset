import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { resolveLocalDatasetAsset } from './local-assets.ts';

describe('resolveLocalDatasetAsset', () => {
    const root = resolve('out', 'dataset');

    it('allows encoded PNG paths in train and validation', () => {
        expect(resolveLocalDatasetAsset(root, 'train/module/file%20name.png')).toBe(
            resolve(root, 'train', 'module', 'file name.png'),
        );
        expect(resolveLocalDatasetAsset(root, 'validation/module/file.PNG')).toBe(
            resolve(root, 'validation', 'module', 'file.PNG'),
        );
    });

    it('rejects traversal, unknown splits, malformed encoding, and non-images', () => {
        expect(resolveLocalDatasetAsset(root, 'train/../../../secret.png')).toBeNull();
        expect(resolveLocalDatasetAsset(root, 'train/%2e%2e/%2e%2e/secret.png')).toBeNull();
        expect(resolveLocalDatasetAsset(root, 'other/module/file.png')).toBeNull();
        expect(resolveLocalDatasetAsset(root, 'train/module/file.json')).toBeNull();
        expect(resolveLocalDatasetAsset(root, 'train/%E0%A4%A')).toBeNull();
    });
});
