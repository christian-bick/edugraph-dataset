import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {CountingHundredMoreLessViewSchema, spec} from './spec.ts';

describe('counting-hundred-more-less view spec', () => {
    it('accepts only the generator-established hundred-step family', () => {
        expect(spec.requiredLabels).toEqual([Scope.StepsOf100]);
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
        expect(CountingHundredMoreLessViewSchema).toEqual({});
    });
});
