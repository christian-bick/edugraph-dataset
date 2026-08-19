import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('FractionsWholeEquivalenceViewSpec', () => {
    it('owns the numeral presentation and its invariant Formalization task', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.Formalization
        ]);
    });
});
