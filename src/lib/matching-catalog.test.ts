import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
    clearGenerationCatalogCaches,
    loadGeneratorCatalog,
    loadViewCatalog
} from './generation.ts';
import {
    clearMatchingCatalogCaches,
    loadGeneratorMatchCatalog,
    loadViewMatchCatalog
} from './matching-catalog.ts';

beforeEach(() => {
    clearGenerationCatalogCaches();
    clearMatchingCatalogCaches();
});

const temporaryRoots: string[] = [];

afterEach(() => {
    for (const root of temporaryRoots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('matching-only catalogs', () => {
    it('reproduces full catalog matching semantics without exposing implementations', async () => {
        const [fullGenerators, matchGenerators, fullViews, matchViews] = await Promise.all([
            loadGeneratorCatalog(),
            loadGeneratorMatchCatalog(),
            loadViewCatalog(),
            loadViewMatchCatalog()
        ]);
        expect(matchGenerators).toEqual(fullGenerators.map(entry => ({
            generatorId: entry.generatorId,
            labels: entry.labels,
            problemType: entry.problemType
        })));
        expect(matchViews).toEqual(fullViews.map(entry => ({
            viewId: entry.viewId,
            supportedLabels: entry.supportedLabels,
            requiredLabels: entry.requiredLabels,
            rejectedLabels: entry.rejectedLabels,
            problemType: entry.problemType
        })));
    }, 30_000);

    it('does not import or execute generator implementations', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-match-catalog-'));
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

        await expect(loadGeneratorMatchCatalog(root)).resolves.toEqual([{
            generatorId: 'demo',
            labels: ['Capability'],
            problemType: 'DemoProblem'
        }]);
    });
});
