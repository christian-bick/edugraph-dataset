import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MultiDigitMultiplicationGenerator} from './generator.ts';
import {spec} from './spec.ts';

const profiles = [
    [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand, 1, 1],
    [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, 1, 2],
    [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand, 1, 3],
    [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand, 1, 4],
    [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand, 2, 2]
] as const;

describe('MultiDigitMultiplicationGenerator spec integration', () => {
    const generator = new MultiDigitMultiplicationGenerator();

    it('declares the invariant two-positive-integer multiplication structure', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.MultiplicationPartialProducts,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it.each(profiles)('resolves %s with %s', (
        smallestLabel,
        largestLabel,
        smallestOperandDigits,
        largestOperandDigits
    ) => {
        setSeed(`${smallestLabel}-${largestLabel}`);
        const stub = generateWithLabels(generator, [
            Area.MultiplicationPartialProducts,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.TwoOperands,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding,
            smallestLabel,
            largestLabel
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.smallestOperandDigits).toBe(smallestOperandDigits);
        expect(stub!.data.largestOperandDigits).toBe(largestOperandDigits);
        expect(stub!.tags).toEqual(expect.arrayContaining([smallestLabel, largestLabel]));
    });

    it('rejects an unauthored operand profile combination', () => {
        expect(() => generateWithLabels(generator, [
            Area.Multiplication,
            Scope.TwoOperands,
            Scope.TwoDigitSmallestOperand,
            Scope.FourDigitLargestOperand
        ])).toThrow();
    });
});
