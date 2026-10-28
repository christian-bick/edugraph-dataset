import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {NumbersDecimalPlaceValueScalingViewSchema, spec} from './spec.ts';

describe('numbers-decimal-place-value-scaling view spec', () => {
    it('owns the invariant concept-derivation task with no mathematical configuration', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation, Scope.ArabicNumerals]);
        expect(NumbersDecimalPlaceValueScalingViewSchema).toEqual({});
    });
});
