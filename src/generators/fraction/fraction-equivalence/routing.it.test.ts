import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';
import {matchesTarget} from '../../../lib/matching.ts';
import {resolve} from 'node:path';

describe('fraction family routing', () => {
    it('does not route proper fractions into the whole-number view even when every target label is supported', async () => {
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([
                ['fraction-equivalence', resolve(import.meta.dirname, 'spec.ts')]
            ])),
            loadViewModelCatalog(undefined, undefined, new Map([
                ['fractions-whole-equivalence', resolve(import.meta.dirname, '../../../visuals/views/fractions/fractions-whole-equivalence/spec.ts')]
            ]))
        ]);
        const generator = generators.find(entry => entry.generatorId === 'fraction-equivalence')!;
        const view = views.find(entry => entry.viewId === 'fractions-whole-equivalence')!;
        expect(matchesTarget([Area.FractionEquivalence, Scope.ProperFractions, Scope.EqualShares,
            Scope.Equal, Ability.Formalization, Scope.ArabicNumerals], generator, view))
            .toEqual({matched: false, reason: 'incompatible-type'});
    });
});
