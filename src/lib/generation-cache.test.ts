import {mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {clearGenerationCatalogCaches, loadGeneratorCatalog, loadViewCatalog} from './generation.ts';
import {createWorkCounters} from './work-counters.ts';

const roots: string[] = [];

afterEach(() => {
    clearGenerationCatalogCaches();
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('generation catalog caches', () => {
    it('discovers each catalog root once per process', async () => {
        mkdirSync('temp', {recursive: true});
        const root = mkdtempSync(resolve('temp', 'catalog-cache-'));
        roots.push(root);
        const generators = resolve(root, 'generators');
        const views = resolve(root, 'views');
        mkdirSync(generators);
        mkdirSync(views);
        const counters = createWorkCounters();

        await loadGeneratorCatalog(generators, counters);
        await loadGeneratorCatalog(generators, counters);
        await loadViewCatalog(views, counters);
        await loadViewCatalog(views, counters);

        expect(counters.snapshot()).toMatchObject({
            'catalog.generator_discoveries': 1,
            'catalog.generator_cache_hits': 1,
            'catalog.view_discoveries': 1,
            'catalog.view_cache_hits': 1,
        });
    });
});
