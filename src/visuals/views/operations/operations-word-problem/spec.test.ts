import {Ability} from 'edugraph-ts';
import {deductAdmitting, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem view spec', () => {
    it('owns invariant direct-answer scenario reception', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers
        ]);
        expect(spec.rejectedLabels).toEqual([
            ...deductAdmitting([Scope.NumbersLarger20]),
            ...deductAdmitting([Scope.NumbersWithNegatives])
        ]);
    });
});
