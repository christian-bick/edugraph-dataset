import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
    SourceContentIndex,
    digestContent,
    hashPackageStateWithoutDependency,
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

    it('reads overlapping source files only once', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-source-index-'));
        mkdirSync(resolve(root, 'shared'), {recursive: true});
        writeFileSync(resolve(root, 'shared', 'one.ts'), 'one');
        writeFileSync(resolve(root, 'shared', 'two.ts'), 'two');

        try {
            const index = new SourceContentIndex(root);
            const complete = index.hash([resolve(root, 'shared')]);
            const subset = index.hash([resolve(root, 'shared', 'one.ts')]);
            const identities = index.identities([
                resolve(root, 'shared'),
                resolve(root, 'shared', 'one.ts')
            ]);

            expect(complete).not.toBe(subset);
            expect(identities.map(identity => identity.path)).toEqual([
                'shared/one.ts',
                'shared/two.ts'
            ]);
            expect(index.stats()).toEqual({
                directories_read: 1,
                files_read: 2,
                bytes_read: 6
            });
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('separates one semantic package from the shared runtime dependency identity', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-package-identity-'));
        const writePackages = (ontology: string, renderer: string): void => {
            writeFileSync(resolve(root, 'package.json'), JSON.stringify({
                dependencies: {'edugraph-ts': ontology, renderer}
            }));
            writeFileSync(resolve(root, 'package-lock.json'), JSON.stringify({
                lockfileVersion: 3,
                packages: {
                    'node_modules/edugraph-ts': {version: ontology},
                    'node_modules/renderer': {version: renderer}
                }
            }));
        };
        try {
            writePackages('v1', 'v1');
            const initial = hashPackageStateWithoutDependency(root, 'edugraph-ts');
            writePackages('v2', 'v1');
            expect(hashPackageStateWithoutDependency(root, 'edugraph-ts')).toBe(initial);
            writePackages('v2', 'v2');
            expect(hashPackageStateWithoutDependency(root, 'edugraph-ts')).not.toBe(initial);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
