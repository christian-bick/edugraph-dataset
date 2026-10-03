import {describe, expect, it} from 'vitest';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {
    assertDecimalWritingProblem,
    decimalNumberName,
    decimalReadingChoices,
    decimalResponseDigits
} from './decimal-writing-helpers.ts';

const placeholder: DecimalWritingProblem = {
    kind: 'decimal-writing', base: 10, wholePart: 5,
    valueInThousandths: 5008, canonicalNumeral: '5.008',
    fractionalPart: {precision: 'thousandths', digits: [0, 0, 8], numerator: 8, denominator: 1000}
};

describe('decimal-writing view presentation', () => {
    it('retains interior zero placeholders in the numeral while naming the exact fraction', () => {
        expect(() => assertDecimalWritingProblem('test', placeholder)).not.toThrow();
        expect(decimalNumberName(placeholder)).toBe('five and eight thousandths');
        expect(decimalResponseDigits(placeholder)).toEqual(['5', '.', '0', '0', '8']);
    });

    it('makes reading options denote four distinct values with one correct meaning', () => {
        const choices = decimalReadingChoices(placeholder, 13);
        expect(choices).toHaveLength(4);
        expect(new Set(choices.map(choice => choice.valueInThousandths)).size).toBe(4);
        expect(new Set(choices.map(choice => choice.name)).size).toBe(4);
        expect(choices.filter(choice => choice.correct)).toEqual([{
            valueInThousandths: 5008,
            name: 'five and eight thousandths',
            correct: true
        }]);
    });

    it('keeps alternatives within the same whole part at a near-one fractional boundary', () => {
        const nearBoundary: DecimalWritingProblem = {
            ...placeholder,
            valueInThousandths: 5999,
            canonicalNumeral: '5.999',
            fractionalPart: {precision: 'thousandths', digits: [9, 9, 9], numerator: 999, denominator: 1000}
        };
        const choices = decimalReadingChoices(nearBoundary, 3);
        expect(choices.every(choice => choice.valueInThousandths >= 5001 && choice.valueInThousandths <= 5999)).toBe(true);
        expect(new Set(choices.map(choice => choice.valueInThousandths)).size).toBe(4);
    });

    it('rejects a missing thousandths placeholder or an inconsistent numeral', () => {
        expect(() => assertDecimalWritingProblem('test', {
            ...placeholder,
            canonicalNumeral: '5.08'
        })).toThrow('must agree');
        expect(() => assertDecimalWritingProblem('test', {
            ...placeholder,
            fractionalPart: {precision: 'thousandths', digits: [0, 8, 0], numerator: 80, denominator: 1000}
        })).toThrow('necessary final place');
    });
});
