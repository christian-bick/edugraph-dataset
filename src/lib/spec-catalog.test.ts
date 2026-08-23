import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {
    listSpecModules,
    listUnionSpecs,
    loadSpecEquivalences,
    loadSpecMetadata,
    loadSpecTodos,
    loadTargets
} from './spec-catalog.ts';

const roots: string[] = [];

function fixture(): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-spec-catalog-'));
    roots.push(root);
    const write = (module: string, file: string, content: string) => {
        const directory = resolve(root, module);
        mkdirSync(directory, {recursive: true});
        writeFileSync(resolve(directory, file), content, 'utf-8');
    };
    write('standard', 'b.ts', "export const spec = [{id: 'b', labels: []}];");
    write('standard', 'a.ts', `
        export const spec = [{id: 'a', labels: []}];
        export const equivalentTargets = [{left: 'a', right: 'b', reason: 'same'}];
        export const beyondScope = [{standardId: 'X', title: 'x', description: 'x'}];
    `);
    write('isolated', '_module.ts', 'export const isolated = true;');
    write('isolated', 'a.ts', 'export const spec = [];');
    write('later', '_module.ts', 'export const unionOrder = 200;');
    write('later', 'a.ts', 'export const spec = [];');
    return root;
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});
describe('spec catalog', () => {
    it('loads deterministic targets, equivalences, and dispositions', async () => {
        const root = fixture();
        expect((await loadTargets('standard', root)).map(target => target.id)).toEqual(['a', 'b']);
        expect(await loadSpecEquivalences('standard', root)).toEqual([
            {left: 'a', right: 'b', reason: 'same'}
        ]);
        expect(await loadSpecTodos('standard', root)).toMatchObject({
            implementationTodos: [],
            ontologyTodos: [],
            beyondScope: [{standardId: 'X', title: 'x', description: 'x'}]
        });
    });

    it('orders union modules and excludes isolated development specs', async () => {
        const root = fixture();
        expect(listSpecModules(root)).toEqual(['isolated', 'later', 'standard']);
        expect(await loadSpecMetadata('isolated', root)).toEqual({isolated: true, unionOrder: 100});
        expect(await listUnionSpecs(root)).toEqual(['standard', 'later']);
    });
});
