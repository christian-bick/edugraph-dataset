import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
    canonicalStandardsIdentity,
    readCanonicalStandardsTree
} from './standards-source.ts';

const canonicalTree = {
    tree: {Kindergarten: {}},
    standardsMap: {
        'K.CC.A.1': {
            id: 'K.CC.A.1',
            description: 'Count to 100 by ones and by tens.',
            level: 'Standard',
            aspects: [],
            children: [],
            modeling: false
        }
    }
};

function fixture(value: unknown = canonicalTree): string {
    const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-standards-source-'));
    const directory = resolve(projectRoot, 'public', 'coverage');
    mkdirSync(directory, {recursive: true});
    writeFileSync(resolve(directory, 'ccss-tree.json'), JSON.stringify(value));
    return projectRoot;
}

describe('canonical standards source', () => {
    it('reads the tracked canonical tree and identifies its exact bytes', () => {
        const projectRoot = fixture();
        try {
            expect(readCanonicalStandardsTree(projectRoot)).toEqual(canonicalTree);
            expect(canonicalStandardsIdentity(projectRoot)).toMatchObject({
                path: 'public/coverage/ccss-tree.json',
                sha256: expect.stringMatching(/^[a-f\d]{64}$/),
                bytes: expect.any(Number)
            });
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('changes identity when the canonical tree changes', () => {
        const projectRoot = fixture();
        try {
            const before = canonicalStandardsIdentity(projectRoot);
            writeFileSync(
                resolve(projectRoot, 'public', 'coverage', 'ccss-tree.json'),
                JSON.stringify({...canonicalTree, tree: {Kindergarten: {}, 'Grade 1': {}}})
            );
            expect(canonicalStandardsIdentity(projectRoot).sha256).not.toBe(before.sha256);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('rejects an incomplete canonical tree', () => {
        const projectRoot = fixture({tree: {}});
        try {
            expect(() => readCanonicalStandardsTree(projectRoot))
                .toThrow('Canonical standards tree is invalid');
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});
