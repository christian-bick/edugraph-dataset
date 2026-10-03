import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {CoordinateFormPatternPairsViewSchema, spec} from './spec.ts';

describe('coordinate-form-pattern-pairs view spec', () => {
    it('owns its fixed task identity and limits participation to that Area', () => {
        expect(spec.generalLabels).toEqual([Area.OrderedCoordinatePair, Scope.ArabicNumerals, Ability.Formalization]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.OrderedCoordinatePair]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(CoordinateFormPatternPairsViewSchema).toEqual({});
    });
});
