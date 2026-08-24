import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {CountingTenMoreLessViewSchema, spec} from './spec.ts';

describe('counting-ten-more-less view spec', () => {
    it('accepts only the generator-established ten-step family', () => {
        expect(spec.requiredLabels).toEqual([Scope.StepsOf10]);
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
        expect(CountingTenMoreLessViewSchema).toEqual({});
    });
});
