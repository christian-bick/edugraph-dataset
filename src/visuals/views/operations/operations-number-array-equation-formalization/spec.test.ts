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
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsNumberArrayEquationFormalizationViewSchema).toEqual({});
    });
});
