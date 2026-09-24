import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem-inversion view spec', () => {
    it('owns invariant scenario inversion', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.ProcedureInversion,
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')?.toSorted()).toEqual([
            ...deductAdmitting([Scope.NumbersLarger20]),
            ...deductAdmitting([Scope.NumbersWithNegatives]),
            Area.CommutativeLaw,
            Area.AssociativeLaw,
            Area.DistributiveLaw
        ].toSorted());
    });
});
