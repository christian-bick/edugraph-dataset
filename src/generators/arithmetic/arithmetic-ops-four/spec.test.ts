import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsFourGenerator} from './generator.ts';

describe('ArithmeticOpsFourGenerator spec integration', () => {
    it('resolves the four-addend target', () => {
        const stub = generateWithLabels(new ArithmeticOpsFourGenerator(), [
            Area.Addition,
            Scope.FourOperands,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersLarger10,
            Scope.NumbersSmaller100,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.num4).toBeGreaterThanOrEqual(10);
        expect(stub!.data.answer).toBeLessThanOrEqual(100);
    });
});
