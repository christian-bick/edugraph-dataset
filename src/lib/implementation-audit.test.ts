import {afterEach, describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inspectModuleImplementations} from './implementation-audit.ts';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true}); });

describe('owned implementation audit', () => {
    it('attributes reachable helper violations to the consuming generator without any target', () => {
        mkdirSync('temp', {recursive: true});
        const root = mkdtempSync(resolve('temp', 'implementation-audit-'));
        roots.push(root);
        const module = resolve(root, 'src/generators/demo');
        mkdirSync(module, {recursive: true});
        writeFileSync(resolve(module, 'generator.ts'),
            'import {helper} from "./helper.ts"; class Demo {generate(config: object) {return helper(config);}}');
        writeFileSync(resolve(module, 'helper.ts'),
            'export const helper = (config: object) => { const p = payload.problem; return p["labels"]; };');
        const issues = inspectModuleImplementations(root, {
            generators: [{id: 'demo', absolutePath: module, relativePath: 'demo', category: null}],
            views: [], generatorSchemaSizes: new Map([['demo', 1]])
        });
        expect(issues.some(issue => issue.module_id === 'demo' && issue.file.endsWith('helper.ts')
            && issue.rule === 'IMPL-G3')).toBe(true);
        expect(issues.some(issue => issue.rule === 'IMPL-G2' && issue.severity === 'error')).toBe(true);
    });
});
