import {afterEach, describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectModuleInventory} from './module-inventory.ts';
import type {LeafModule} from './module-resolver.ts';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true}); });

function leaf(role: 'generator' | 'view'): LeafModule {
    mkdirSync('temp', {recursive: true});
    const root = mkdtempSync(resolve('temp', `inventory-${role}-`));
    roots.push(root);
    return {id: 'demo', absolutePath: root, relativePath: 'demo', category: null};
}

describe('module inventory', () => {
    it('reports missing schema, entry files and a view type mapping', () => {
        const generator = leaf('generator');
        writeFileSync(resolve(generator.absolutePath, 'spec.ts'), 'export const spec = {};');
        const view = leaf('view');
        writeFileSync(resolve(view.absolutePath, 'spec.ts'), 'export const spec = {};');
        const issues = inspectModuleInventory({generators: [generator], views: [view], viewTypes: {}});
        expect(issues.some(issue => issue.message.includes('missing exported DemoGeneratorSchema'))).toBe(true);
        expect(issues.some(issue => issue.message.includes('missing ViewTypeMap'))).toBe(true);
        expect(issues.some(issue => issue.message.includes('missing required checklist.md'))).toBe(true);
    });

    it('rejects headings in a leaf checklist and orphan type mappings', () => {
        const view = leaf('view');
        writeFileSync(resolve(view.absolutePath, 'spec.ts'),
            'export const spec = {}; export const DemoViewSchema = {}; export type DemoViewConfig = {};');
        writeFileSync(resolve(view.absolutePath, 'checklist.md'), '# Heading');
        writeFileSync(resolve(view.absolutePath, 'view.tsx'), 'const View = withConfig(DemoViewSchema, Core);');
        writeFileSync(resolve(view.absolutePath, 'view.html'), '<div id="view"></div>');
        const issues = inspectModuleInventory({generators: [], views: [view],
            viewTypes: {demo: 'CountingProblem', orphan: 'MissingProblem'}});
        expect(issues.map(issue => issue.rule)).toEqual(['CHK-V6', 'SPEC-V1']);
    });

    it('reports generator entry files that discovery cannot see without a spec', () => {
        const module = leaf('generator');
        writeFileSync(resolve(module.absolutePath, 'generator.ts'), 'export class Hidden {}');
        const issues = inspectModuleInventory({generators: [], views: [], viewTypes: {},
            generatorRoot: resolve(module.absolutePath, '..')});
        expect(issues.some(issue => issue.rule === 'IMPL-2'
            && issue.file === resolve(module.absolutePath, 'generator.ts'))).toBe(true);
    });

    it.each(['UndeclaredProblem', 'any', null])('rejects an unresolved output contract %s without an active target', type => {
        const generator = leaf('generator');
        writeFileSync(resolve(generator.absolutePath, 'generator.ts'), type
            ? `class Demo implements ProblemGenerator<${type}, Config> {}` : 'class Demo {}');
        const view = leaf('view');
        const issues = inspectModuleInventory({generators: [generator], views: [view],
            viewTypes: {demo: type ?? ''}});
        expect(issues.some(issue => issue.rule === 'IMPL-G6' && issue.message.includes('payload type'))).toBe(true);
        expect(issues.some(issue => issue.rule === 'SPEC-V1' && issue.message.includes('ViewTypeMap'))).toBe(true);
    });
});
