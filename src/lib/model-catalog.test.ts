import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, relative, resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
    clearGenerationCatalogCaches,
    loadGeneratorCatalog,
    loadViewCatalog
} from './generation.ts';
import {
    clearModelCatalogCaches,
    loadGeneratorModelCatalog,
    loadViewModelCatalog
} from './model-catalog.ts';

beforeEach(() => {
    clearGenerationCatalogCaches();
    clearModelCatalogCaches();
});

const temporaryRoots: string[] = [];

function sourceFixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-matching-source-'));
    temporaryRoots.push(root);
    const files: Record<string, string> = {
        'src/shared/rules.ts': 'export const capabilities = ["Capability"];',
        'src/shared/index.ts': 'export {capabilities} from "./rules.ts";',
        'src/generators/demo/spec.ts': `
            import {capabilities} from '../../shared/index.ts';
            export const spec = {generalLabels: capabilities};
            export const DemoGeneratorSchema = {};
        `,
        'src/generators/demo/generator.ts': `
            throw new Error('must not import the implementation');
            export class DemoGenerator implements ProblemGenerator<DemoProblem> {}
        `,
        'src/views/demo-view/spec.ts': `
            import {capabilities} from '../../shared/index.ts';
            export const spec = {viewId: 'demo-view', generalLabels: capabilities};
            export const DemoViewViewSchema = {};
        `,
        'src/views/demo-view/view.tsx': 'throw new Error("must not import the renderer");'
    };
    for (const [path, contents] of Object.entries(files)) {
        mkdirSync(dirname(resolve(root, path)), {recursive: true});
        writeFileSync(resolve(root, path), contents);
    }
    const load = async (role: 'generator' | 'view') => {
        const catalogRoot = resolve(root, 'src', role === 'generator' ? 'generators' : 'views');
        const loader = role === 'generator' ? loadGeneratorModelCatalog : loadViewModelCatalog;
        return (await loader(catalogRoot, undefined, undefined, {sourceRoot: root}))[0];
    };
    return {root, load};
}

afterEach(() => {
    for (const root of temporaryRoots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('model catalogs', () => {
    it('is the canonical source of full catalog matching semantics', async () => {
        const [fullGenerators, modelGenerators, fullViews, modelViews] = await Promise.all([
            loadGeneratorCatalog(),
            loadGeneratorModelCatalog(),
            loadViewCatalog(),
            loadViewModelCatalog()
        ]);
        expect(modelGenerators.map(({generatorId, generalLabels, labels, problemType}) => ({
            generatorId,
            generalLabels,
            labels,
            problemType
        }))).toEqual(fullGenerators.map(({generatorId, generalLabels, labels, problemType}) => ({
            generatorId,
            generalLabels,
            labels,
            problemType
        })));
        expect(modelViews.map(({viewId, generalLabels, supportedLabels, requiredLabels, rejectedLabels, problemType}) => ({
            viewId,
            generalLabels,
            supportedLabels,
            requiredLabels,
            rejectedLabels,
            problemType
        }))).toEqual(fullViews.map(({viewId, generalLabels, supportedLabels, requiredLabels, rejectedLabels, problemType}) => ({
            viewId,
            generalLabels,
            supportedLabels,
            requiredLabels,
            rejectedLabels,
            problemType
        })));
    }, 30_000);

    it('does not import or execute generator implementations', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-model-catalog-'));
        temporaryRoots.push(root);
        const moduleRoot = resolve(root, 'demo');
        mkdirSync(moduleRoot, {recursive: true});
        writeFileSync(resolve(moduleRoot, 'spec.ts'), `
            export const spec = {generalLabels: ['Capability']};
            export const DemoGeneratorSchema = {};
        `, 'utf-8');
        writeFileSync(resolve(moduleRoot, 'generator.ts'), `
            throw new Error('generator implementation was imported');
            export class DemoGenerator implements ProblemGenerator<DemoProblem> {}
        `, 'utf-8');

        const [descriptor] = await loadGeneratorModelCatalog(root);
        expect(descriptor).toMatchObject({
            generatorId: 'demo',
            generalLabels: ['Capability'],
            labels: ['Capability'],
            problemType: 'DemoProblem'
        });
        expect(descriptor.matchingSourcePaths).toEqual([resolve(moduleRoot, 'spec.ts')]);
        expect(descriptor.matchingSourceHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it.each(['generator', 'view'] as const)('tracks imported %s spec helpers after clearing catalog caches', async role => {
        const {root, load} = sourceFixture();
        const before = await load(role);
        const paths = before.matchingSourcePaths.map(path => relative(root, path).replaceAll('\\', '/'));
        expect(paths).toContain('src/shared/index.ts');
        expect(paths).toContain('src/shared/rules.ts');
        expect(paths).not.toContain('src/generators/demo/generator.ts');
        expect(paths).not.toContain('src/views/demo-view/view.tsx');

        writeFileSync(resolve(root, 'src/shared/rules.ts'), 'export const capabilities = ["ChangedCapability"];');
        expect((await load(role)).matchingSourceHash).toBe(before.matchingSourceHash);
        clearModelCatalogCaches();
        const after = await load(role);
        expect(after.matchingSourceHash).not.toBe(before.matchingSourceHash);
        expect(after.matchingSourcePaths).toEqual(before.matchingSourcePaths);
    });

    it('keeps matching source hashes unchanged for implementation and renderer edits', async () => {
        const {root, load} = sourceFixture();
        const before = await Promise.all([load('generator'), load('view')]);
        writeFileSync(resolve(root, 'src/generators/demo/generator.ts'), `
            throw new Error('changed implementation must not run');
            export class DemoGenerator implements ProblemGenerator<DemoProblem> { changed = true; }
        `);
        writeFileSync(resolve(root, 'src/views/demo-view/view.tsx'), 'throw new Error("changed renderer must not run");');
        clearModelCatalogCaches();
        const after = await Promise.all([load('generator'), load('view')]);
        expect(after.map(entry => entry.matchingSourceHash)).toEqual(before.map(entry => entry.matchingSourceHash));
    });

    it('uses source-root-relative content identity across checkouts', async () => {
        const first = sourceFixture();
        const second = sourceFixture();
        const firstEntries = await Promise.all([first.load('generator'), first.load('view')]);
        const secondEntries = await Promise.all([second.load('generator'), second.load('view')]);
        expect(firstEntries.map(entry => entry.matchingSourceHash))
            .toEqual(secondEntries.map(entry => entry.matchingSourceHash));
        expect(firstEntries[0].matchingSourcePaths).not.toEqual(secondEntries[0].matchingSourcePaths);
    });

    it('rejects a source root that would silently omit the catalog specs', async () => {
        const {root} = sourceFixture();
        await expect(loadGeneratorModelCatalog(resolve(root, 'src/generators'), undefined, undefined, {
            sourceRoot: resolve(root, 'src/shared')
        })).rejects.toThrow('outside its matching source root');
    });
});
