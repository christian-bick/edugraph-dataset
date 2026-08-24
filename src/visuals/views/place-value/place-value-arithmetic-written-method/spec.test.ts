import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {PlaceValueArithmeticWrittenMethodViewSchema, spec} from './spec.ts';

describe('place-value-arithmetic-written-method view spec', () => {
    it('owns the invariant model-to-written-method conjunction', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding,
            Ability.Formalization
        ]);
        expect(spec.requiredLabels).toEqual([Ability.Formalization]);
        expect(spec.rejectedLabels).toContain(Scope.NumbersSmaller10);
        expect(PlaceValueArithmeticWrittenMethodViewSchema).toEqual({});
    });
});
