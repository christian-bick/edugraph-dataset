import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberLineArithmeticViewSchema, spec} from './spec.ts';

describe('operations-number-line-arithmetic view spec', () => {
    it('owns invariant execution and excludes unsupported operations', () => {
        expect(spec.generalLabels).toEqual([Scope.Numberline, Ability.ProcedureExecution]);
        expect(spec.rejectedLabels).toEqual(expect.arrayContaining([
            Area.Multiplication,
            Area.Division,
            Scope.NumbersWithoutZero
        ]));
        expect(OperationsNumberLineArithmeticViewSchema).toEqual({});
    });
});
