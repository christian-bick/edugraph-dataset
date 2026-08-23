import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsEqualGroupsViewSchema, spec} from './spec.ts';

describe('operations-equal-groups view spec', () => {
    it('owns one invariant equal-groups interpretation action', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PhysicalNumbers,
            Scope.ArabicNumerals,
            Ability.Interpretation
        ]);
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsEqualGroupsViewSchema).toEqual({});
    });
});
