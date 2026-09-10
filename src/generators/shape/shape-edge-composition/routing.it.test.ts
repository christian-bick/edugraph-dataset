import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {buildCompatibleModulePairIndex, matchesTarget} from '../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';

describe('edge-composition routing', () => {
    it('keeps assembly separate from attribute construction and drawing', async () => {
        const generatorIds = ['shape-edge-composition', 'shape-build-shape'];
        const viewIds = ['shape-build-from-parts', 'shape-build-shape', 'shape-draw-linear-shape', 'shape-draw-circular-shape'];
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map(generatorIds.map(id =>
                [id, fileURLToPath(new URL(`../${id}/spec.ts`, import.meta.url))]))),
            loadViewModelCatalog(undefined, undefined, new Map(viewIds.map(id =>
                [id, fileURLToPath(new URL(`../../../visuals/views/shape/${id}/spec.ts`, import.meta.url))])))
        ]);
        const index = buildCompatibleModulePairIndex(generators, views);
        expect(index.orderedPairs.filter(({generator, view}) => generator.generatorId === 'shape-edge-composition'
            || view.viewId === 'shape-build-from-parts').map(({generator, view}) => `${generator.generatorId}#${view.viewId}`))
            .toEqual(['shape-edge-composition#shape-build-from-parts']);
        const other = generators.find(generator => generator.generatorId === 'shape-build-shape')!;
        const assembly = views.find(view => view.viewId === 'shape-build-from-parts')!;
        expect(matchesTarget(assembly.generalLabels, other, assembly)).toEqual({matched: false, reason: 'incompatible-type'});
    });
});
