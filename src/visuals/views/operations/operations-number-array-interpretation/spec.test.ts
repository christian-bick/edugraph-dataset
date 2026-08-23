import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberArrayInterpretationViewSchema, spec} from './spec.ts';

describe('operations-number-array-interpretation view spec', () => {
    it('owns interpreting the equal-group roles represented by an array', () => {
        expect(spec.generalLabels).toEqual([
            Scope.NumberArray,
            Scope.ArabicNumerals,
            Ability.Interpretation
        ]);
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsNumberArrayInterpretationViewSchema).toEqual({});
    });
});
