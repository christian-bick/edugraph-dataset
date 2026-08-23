import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {AssetLibraryIndex, isAssetLibraryPath} from './asset-library.ts';

const roots: string[] = [];

function fixture(): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-asset-library-'));
    roots.push(root);
    for (const path of [
        'public/icons/counting/circle.svg',
        'public/icons/counting/square.svg',
        'public/icons/measures/ruler.png',
        'public/icons/ignored/readme.txt'
    ]) {
        mkdirSync(resolve(root, path, '..'), {recursive: true});
        writeFileSync(resolve(root, path), path, 'utf-8');
    }
    return root;
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('AssetLibraryIndex', () => {
    it('resolves literal records and conservative template collections', () => {
        const root = fixture();
        const index = new AssetLibraryIndex(root);
        const files = index.filesUsedBy(`
            const exact = '/icons/measures/ruler.png';
            const selected = \`/icons/counting/\${icon}\`;
            const absent = '/icons/missing.svg';
        `).map(path => path.replace(root, '').replaceAll('\\', '/'));

        expect(files).toEqual([
            '/public/icons/counting/circle.svg',
            '/public/icons/counting/square.svg',
            '/public/icons/measures/ruler.png'
        ]);
    });

    it('recognizes supported asset-library records', () => {
        expect(isAssetLibraryPath('public/icons/cube.svg')).toBe(true);
        expect(isAssetLibraryPath('public\\icons\\photo.AVIF')).toBe(true);
        expect(isAssetLibraryPath('public/icons/readme.txt')).toBe(false);
        expect(isAssetLibraryPath('src/icons/cube.svg')).toBe(false);
    });
});
