import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {buildCompatibleModulePairIndex, matchesTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';

describe('measurement observation and extrema contracts', () => {
    it('requires the arithmetic payload structurally rather than through a label flag', async () => {
        const generatorIds = ['measurement-data', 'measurement-extrema'];
        const viewIds = ['measurement-data-table', 'measurement-line-plot', 'measurement-line-plot-arithmetic'];
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map(generatorIds.map(id =>
                [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))]))),
            loadViewModelCatalog(undefined, undefined, new Map(viewIds.map(id =>
                [id, fileURLToPath(new URL(`../../visuals/views/data/${id}/spec.ts`, import.meta.url))])))
        ]);
        const index = buildCompatibleModulePairIndex(generators, views);
        expect(index.orderedPairs.map(({generator, view}) => `${generator.generatorId}#${view.viewId}`).sort())
            .toEqual([
                'measurement-data#measurement-data-table',
                'measurement-data#measurement-line-plot',
                'measurement-extrema#measurement-line-plot-arithmetic'
            ]);
        const plain = generators.find(generator => generator.generatorId === 'measurement-data')!;
        const arithmetic = views.find(view => view.viewId === 'measurement-line-plot-arithmetic')!;
        expect(arithmetic.requiredLabels ?? []).toEqual([]);
        expect(arithmetic.rejectedLabels ?? []).toEqual([]);
        expect(matchesTarget(arithmetic.generalLabels, plain, arithmetic))
            .toEqual({matched: false, reason: 'incompatible-type'});
    });
});
