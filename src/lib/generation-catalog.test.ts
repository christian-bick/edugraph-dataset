import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {loadGeneratorCatalog, loadViewCatalog} from './generation.ts';
import {createWorkCounters} from './work-counters.ts';

const roots: string[] = [];

function write(path: string, content: string): void {
    mkdirSync(resolve(path, '..'), {recursive: true});
    writeFileSync(path, content, 'utf-8');
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('selected generation catalogs', () => {
    it('loads recorded module entries without discovering unrelated modules', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-selected-catalog-'));
        roots.push(root);
        const generatorsRoot = resolve(root, 'generators');
        const viewsRoot = resolve(root, 'views');
        const generatorEntry = resolve(generatorsRoot, 'demo', 'generator.ts');
        const viewEntry = resolve(viewsRoot, 'demo-view', 'view.tsx');
        write(generatorEntry, `
            interface ProblemGenerator<T> {}
            interface DemoProblem {}
            export class DemoGenerator implements ProblemGenerator<DemoProblem> {}
        `);
        write(resolve(generatorsRoot, 'demo', 'spec.ts'), `
            export const spec = {generalLabels: []};
            export const DemoGeneratorSchema = {};
        `);
        write(resolve(generatorsRoot, 'unrelated', 'spec.ts'), `throw new Error('must not import');`);
        write(viewEntry, 'export const unused = true;');
        write(resolve(viewsRoot, 'demo-view', 'spec.ts'), `
            export const spec = {viewId: 'demo-view', generalLabels: []};
            export const DemoViewViewSchema = {};
        `);
        write(resolve(viewsRoot, 'unrelated', 'spec.ts'), `throw new Error('must not import');`);
        const counters = createWorkCounters();

        const [generators, views] = await Promise.all([
            loadGeneratorCatalog(generatorsRoot, counters, new Map([['demo', generatorEntry]])),
            loadViewCatalog(viewsRoot, counters, new Map([['demo-view', viewEntry]]))
        ]);

        expect(generators.map(entry => entry.generatorId)).toEqual(['demo']);
        expect(views.map(entry => entry.viewId)).toEqual(['demo-view']);
        expect(counters.get('catalog.generator_modules')).toBe(1);
        expect(counters.get('catalog.view_modules')).toBe(1);
    });
});
