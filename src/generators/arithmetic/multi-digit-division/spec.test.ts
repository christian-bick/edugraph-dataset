import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const profiles = [
    [Scope.SingleDigitDividend, 1],
    [Scope.TwoDigitDividend, 2],
    [Scope.ThreeDigitDividend, 3],
    [Scope.FourDigitDividend, 4]
] as const;

describe('MultiDigitDivisionGenerator spec integration', () => {
    const generator = new MultiDigitDivisionGenerator();

    it('declares the truthful imperfect partial-quotient procedure', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.DivisionPartialQuotients,
            Area.Modulo,
            Area.ImperfectDivisibility,
            Area.Multiplication,
            Area.Subtraction,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it.each(profiles)('resolves %s exactly', (dividendLabel, dividendDigits) => {
        setSeed(dividendLabel);
        const stub = generateWithLabels(generator, [
            Area.DivisionPartialQuotients,
            Area.Modulo,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.SingleDigitDivisor,
            dividendLabel,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.dividendDigits).toBe(dividendDigits);
        expect(stub!.data.divisorDigits).toBe(1);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.SingleDigitDivisor,
            dividendLabel
        ]));
    });
});
