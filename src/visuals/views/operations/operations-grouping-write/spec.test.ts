import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsGroupingWriteViewSchema, spec} from './spec.ts';

describe('operations-grouping-write view spec', () => {
    it('owns formalization and participates only in explicitly grouped targets', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.Formalization]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.GroupedExpression]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsGroupingWriteViewSchema).toEqual({});
    });
});
