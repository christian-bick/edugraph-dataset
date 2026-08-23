import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {PlaceValueArithmeticModelViewSchema, spec} from './spec.ts';

describe('place-value arithmetic model spec', () => {
    it('rejects sub-ten grouping targets outside the arithmetic presentation boundary', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.rejectedLabels).toContain(Scope.NumbersSmaller10);
        expect(PlaceValueArithmeticModelViewSchema).toEqual({});
    });
});
