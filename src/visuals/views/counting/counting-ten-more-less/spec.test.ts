import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {CountingTenMoreLessViewSchema, spec} from './spec.ts';

describe('counting-ten-more-less view spec', () => {
    it('accepts only the generator-established ten-step family', () => {
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(CountingTenMoreLessViewSchema).toEqual({});
    });
});
