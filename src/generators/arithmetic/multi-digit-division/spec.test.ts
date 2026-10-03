import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const legacyProfiles = [
    [Scope.SingleDigitDividend, 1],
    [Scope.TwoDigitDividend, 2],
    [Scope.ThreeDigitDividend, 3],
    [Scope.FourDigitDividend, 4]
] as const;
const twoDigitProfiles = legacyProfiles.slice(1);

describe('MultiDigitDivisionGenerator spec integration', () => {
    const generator = new MultiDigitDivisionGenerator();

    it('declares only invariant procedure and number-domain capabilities', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.DivisionPartialQuotients,
            Area.Modulo,
            Area.Multiplication,
            Area.Subtraction,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]));
        expect(spec.generalLabels).not.toContain(Area.ImperfectDivisibility);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithoutZero);
    });

    it.each(legacyProfiles)('resolves legacy %s exactly', (dividendLabel, dividendDigits) => {
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
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.SingleDigitDivisor,
            Area.ImperfectDivisibility,
            Scope.NumbersWithoutZero,
            dividendLabel
        ]));
        expect(stub!.data.remainder).toBeGreaterThan(0);
    });

    it.each(twoDigitProfiles)('resolves two-digit divisor with %s', (dividendLabel, dividendDigits) => {
        setSeed(`two-digit-${dividendLabel}`);
        const stub = generateWithLabels(generator, [
            Area.DivisionPartialQuotients,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoDigitDivisor,
            dividendLabel,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.dividendDigits).toBe(dividendDigits);
        expect(stub!.data.divisorDigits).toBe(2);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.TwoDigitDivisor,
            dividendLabel
        ]));
        expect(stub!.labels).not.toContain(Area.ImperfectDivisibility);
        expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
    });
});
