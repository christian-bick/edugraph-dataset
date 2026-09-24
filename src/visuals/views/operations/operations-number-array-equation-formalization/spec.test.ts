import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberArrayEquationFormalizationViewSchema, spec} from './spec.ts';

describe('operations-number-array-equation-formalization view spec', () => {
    it('owns formalizing the array as an equation', () => {
        expect(spec.generalLabels).toEqual([
            Area.Equation,
            Scope.NumberArray,
            Scope.ExpressionOnOneSide,
            Scope.ArabicNumerals,
            Ability.Formalization
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsNumberArrayEquationFormalizationViewSchema).toEqual({});
    });
});
