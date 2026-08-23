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
    clearModelCatalogCaches,
    loadGeneratorModelCatalog,
    loadViewModelCatalog
} from './model-catalog.ts';

beforeEach(() => {
    clearGenerationCatalogCaches();
    clearModelCatalogCaches();
});

const temporaryRoots: string[] = [];

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
        expect(modelGenerators.map(({generatorId, labels, problemType}) => ({
            generatorId,
            labels,
            problemType
        }))).toEqual(fullGenerators.map(({generatorId, labels, problemType}) => ({
            generatorId,
            labels,
            problemType
        })));
        expect(modelViews.map(({viewId, supportedLabels, requiredLabels, rejectedLabels, problemType}) => ({
            viewId,
            supportedLabels,
            requiredLabels,
            rejectedLabels,
            problemType
        }))).toEqual(fullViews.map(({viewId, supportedLabels, requiredLabels, rejectedLabels, problemType}) => ({
            viewId,
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
            labels: ['Capability'],
            problemType: 'DemoProblem'
        });
    });
});
