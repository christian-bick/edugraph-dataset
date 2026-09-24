import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberArrayInterpretationViewSchema, spec} from './spec.ts';

describe('operations-number-array-interpretation view spec', () => {
    it('owns interpreting the equal-group roles represented by an array', () => {
        expect(spec.generalLabels).toEqual([
            Area.GroupRecognition,
            Scope.EqualShares,
            Scope.NumberArray,
            Scope.ArabicNumerals,
            Ability.Interpretation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsNumberArrayInterpretationViewSchema).toEqual({});
    });
});
