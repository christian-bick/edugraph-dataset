import { describe, expect, it } from 'vitest';
import { localAssetRequestKey } from './local-assets.ts';

describe('localAssetRequestKey', () => {
    it('allows encoded PNG paths in train and validation', () => {
        expect(localAssetRequestKey('train/module/file%20name.png')).toBe('train/module/file name.png');
        expect(localAssetRequestKey('validation/module/file.PNG')).toBe('validation/module/file.PNG');
    });

    it('rejects traversal, unknown splits, malformed encoding, and non-images', () => {
        expect(localAssetRequestKey('train/../../../secret.png')).toBeNull();
        expect(localAssetRequestKey('train/%2e%2e/%2e%2e/secret.png')).toBeNull();
        expect(localAssetRequestKey('other/module/file.png')).toBeNull();
        expect(localAssetRequestKey('train/module/file.json')).toBeNull();
        expect(localAssetRequestKey('train/%E0%A4%A')).toBeNull();
        expect(localAssetRequestKey('train/module%5Cfile.png')).toBeNull();
    });
});
