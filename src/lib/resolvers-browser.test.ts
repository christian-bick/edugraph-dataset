import {existsSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it, vi} from 'vitest';
import {ModelSourceIndex} from './model-source-index.ts';
import {findLeafModules} from './module-resolver.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const serverOnly = new Set([
    'utils.ts', 'inferred-labels.ts', 'spec-ownership.ts', 'spec-contracts.ts',
    'content-identity.ts', 'compatibility.ts'
].map(file => resolve(projectRoot, 'src/lib', file)));

function serverDependencies(entries: string[]): string[] {
    const index = new ModelSourceIndex(projectRoot, {includeAssets: false});
    return index.dependencies(entries).filter(path => serverOnly.has(path))
        .map(path => relative(projectRoot, path).replaceAll('\\', '/'));
}

describe('browser resolver boundary', () => {
    it('keeps resolver imports outside server configuration, inference and audit machinery', () => {
        expect(serverDependencies([resolve(projectRoot, 'src/lib/resolvers.ts')])).toEqual([]);
    });

    it('keeps every production view specification outside server machinery', () => {
        const views = findLeafModules(resolve(projectRoot, 'src/visuals/views'));
        expect(views.length).toBeGreaterThan(0);
        const entries = views.map(view => resolve(view.absolutePath, 'spec.ts')).filter(existsSync);
        expect(serverDependencies(entries)).toEqual([]);
    });

    it('loads and constructs resolver choices when Node crypto is unavailable', async () => {
        vi.resetModules();
        vi.doMock('node:crypto', () => {
            throw new Error('Node crypto cannot be evaluated by browser resolver imports.');
        });
        try {
            const {selectExactLabelSetMap} = await import('./resolvers.ts');
            const choice = selectExactLabelSetMap([
                [['first'], {nested: {width: 1}}],
                [['second'], {nested: {width: 1}}]
            ] as const);
            expect(choice(['first'])).toEqual({nested: {width: 1}});
            expect(choice(['second'])).toEqual({nested: {width: 1}});
        } finally {
            vi.doUnmock('node:crypto');
            vi.resetModules();
        }
    });
});
