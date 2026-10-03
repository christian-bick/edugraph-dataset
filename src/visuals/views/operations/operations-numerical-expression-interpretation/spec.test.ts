import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsNumericalExpressionInterpretationViewSchema, spec} from './spec.ts';

describe('operations-numerical-expression-interpretation view spec', () => {
    it('owns interpretation without imposing a grouping requirement', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.Interpretation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsNumericalExpressionInterpretationViewSchema).toEqual({});
    });
});
