import {describe, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';
import {buildCompatibleModulePairIndex, matchesTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';

describe('unit-relation payload contracts', () => {
    it('routes concrete payload families and shared union consumers without label guards', async () => {
        const expectedViews = new Map([
            ['measurement-conversion', [
                'measure-conversion-derivation', 'measure-conversion-execution', 'measure-conversion-table'
            ]],
            ['measurement-unit-scale', [
                'measure-conversion-derivation', 'measure-unit-scale-relation'
            ]]
        ]);
        const viewPaths = new Map([
            ['measure-conversion-derivation', 'measurement/measure-conversion-derivation'],
            ['measure-conversion-execution', 'measurement/measure-conversion-execution'],
            ['measure-conversion-table', 'measure/measure-conversion-table'],
            ['measure-unit-scale-relation', 'measure/measure-unit-scale-relation']
        ]);
        // Load only the entry points whose shared contract this integration test protects.
        const [generatorCatalog, viewCatalog] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map(
                [...expectedViews.keys()].map(id => [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))])
            )),
            loadViewModelCatalog(undefined, undefined, new Map(
                [...viewPaths].map(([id, path]) => [id, fileURLToPath(new URL(`../../visuals/views/${path}/spec.ts`, import.meta.url))])
            ))
        ]);
        const viewIds = new Set([...expectedViews.values()].flat());
        const generators = generatorCatalog.filter(generator => expectedViews.has(generator.generatorId));
        const views = viewCatalog.filter(view => viewIds.has(view.viewId));
        expect(generators).toHaveLength(2);
        expect(views).toHaveLength(4);

        // No ontology precondition is needed to distinguish these payload families.
        for (const view of views) {
            expect(view.requiredLabels ?? []).toEqual([]);
            expect(view.rejectedLabels ?? []).toEqual([]);
        }
        const index = buildCompatibleModulePairIndex(generators, views);
        for (const generator of generators) {
            const accepted = expectedViews.get(generator.generatorId)!;
            expect(index.orderedPairs
                .filter(pair => pair.generator.generatorId === generator.generatorId)
                .map(pair => pair.view.viewId).sort()).toEqual([...accepted].sort());

            for (const view of views.filter(view => !accepted.includes(view.viewId))) {
                // Even complete positive label coverage cannot admit an incompatible payload.
                expect(matchesTarget(view.generalLabels, generator, view))
                    .toEqual({matched: false, reason: 'incompatible-type'});
            }
        }
    });
});
