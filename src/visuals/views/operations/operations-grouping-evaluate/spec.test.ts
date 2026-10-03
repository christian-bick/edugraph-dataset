import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsGroupingEvaluateViewSchema, spec} from './spec.ts';

describe('operations-grouping-evaluate view spec', () => {
    it('owns execution and participates only in explicitly grouped targets', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.GroupedExpression]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsGroupingEvaluateViewSchema).toEqual({});
    });
});
