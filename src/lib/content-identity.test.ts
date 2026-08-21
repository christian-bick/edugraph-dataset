import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
    digestContent,
    hashSourceFiles,
    radixSortUtf8
} from './content-identity.ts';

describe('content identity', () => {
    it('digests exact bytes', () => {
        expect(digestContent('abc')).toEqual({
            sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
            bytes: 3
        });
    });

    it('orders UTF-8 paths deterministically without comparison sorting', () => {
        expect(radixSortUtf8(['z/file', 'a/z', 'a/a', 'a', 'ä/file']))
            .toEqual(['a', 'a/a', 'a/z', 'z/file', 'ä/file']);
    });

    it('hashes a file set independently of discovery order and honors exclusions', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-content-identity-'));
        mkdirSync(resolve(root, 'nested'));
        writeFileSync(resolve(root, 'a.ts'), 'a');
        writeFileSync(resolve(root, 'nested', 'b.ts'), 'b');
        writeFileSync(resolve(root, 'nested', 'ignored.test.ts'), 'ignored');

        try {
            const include = (path: string): boolean => !path.endsWith('.test.ts');
            const directoryHash = hashSourceFiles(root, [root], {include});
            const reversedHash = hashSourceFiles(root, [
                resolve(root, 'nested', 'b.ts'),
                resolve(root, 'a.ts')
            ], {include});
            expect(directoryHash).toBe(reversedHash);

            writeFileSync(resolve(root, 'nested', 'ignored.test.ts'), 'changed');
            expect(hashSourceFiles(root, [root], {include})).toBe(directoryHash);
            writeFileSync(resolve(root, 'nested', 'b.ts'), 'changed');
            expect(hashSourceFiles(root, [root], {include})).not.toBe(directoryHash);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
