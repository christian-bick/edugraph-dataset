import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {alignedDecimalCoefficient, decimalDigits, decimalPowerOfTen, exactDecimal, parseExactDecimal, validateMagnitudeRange} from './standard-decimal-helpers.ts';

describe('exact standard decimal arithmetic helpers', () => {
    it.each([
        ['0', 0, 0], ['0.000', 0, 3], ['1.20', 120, 2], ['100.005', 100005, 3],
        ['9007199254740991', Number.MAX_SAFE_INTEGER, 0], ['0.000000000000001', 1, 15]
    ] as const)('preserves the literal form %s without rounding', (numeral, coefficient, scale) => {
        expect(parseExactDecimal(numeral)).toEqual({coefficient, scale, numeral});
        expect(exactDecimal(coefficient, scale)).toEqual({coefficient, scale, numeral});
    });

    it.each(['', '01', '00.1', '.5', '1.', '-1', '+1', ' 1.2', '1.2 ', '1e3', 'NaN',
        '9007199254740992', '9007199254740993', '0.0000000000000000', null, 12])('rejects invalid supplied form %s', numeral => {
        expect(() => parseExactDecimal(numeral as string, 'test-owner')).toThrow(GeneratorValidationError);
        expect(() => parseExactDecimal(numeral as string, 'test-owner')).toThrow('test-owner');
    });

    it.each([-1, -0, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid coefficient %s', coefficient => {
        expect(() => exactDecimal(coefficient, 0)).toThrow(GeneratorValidationError);
        expect(() => decimalDigits(coefficient)).toThrow(GeneratorValidationError);
    });

    it.each([-1, 1.5, 16, NaN, Infinity])('rejects unsafe decimal power %s', scale => {
        expect(() => decimalPowerOfTen(scale)).toThrow(GeneratorValidationError);
    });

    it('provides exact powers, minimal coefficient digits and common-scale alignment', () => {
        expect(decimalPowerOfTen(0)).toBe(1);
        expect(decimalPowerOfTen(15)).toBe(1000000000000000);
        expect(decimalDigits(0)).toEqual([0]);
        expect(decimalDigits(10020)).toEqual([1, 0, 0, 2, 0]);
        expect(alignedDecimalCoefficient(parseExactDecimal('1.20'), 3)).toBe(1200);
        expect(alignedDecimalCoefficient(parseExactDecimal('0.000'), 3)).toBe(0);
        expect(() => alignedDecimalCoefficient(parseExactDecimal('1.20'), 1)).toThrow(GeneratorValidationError);
        expect(() => alignedDecimalCoefficient(parseExactDecimal('9007199254740991'), 1)).toThrow(GeneratorValidationError);
        expect(() => alignedDecimalCoefficient({...parseExactDecimal('1.2'), numeral: '1.20'}, 2)).toThrow(GeneratorValidationError);
        expect(() => alignedDecimalCoefficient(null!, 2)).toThrow(GeneratorValidationError);
        expect(() => alignedDecimalCoefficient(3 as never, 2)).toThrow(GeneratorValidationError);
    });

    it('uses real inclusive magnitude bounds and a finite unspecified corpus', () => {
        expect(validateMagnitudeRange({min: 0, max: 100000}, 'test')).toBe(100000);
        expect(validateMagnitudeRange({min: 0, max: 1000000}, 'test')).toBe(1000000);
        expect(validateMagnitudeRange({min: 0, max: Number.MAX_SAFE_INTEGER}, 'test')).toBe(999999);
    });

    it.each([null, 3, {}, {min: 0}, {max: 100000}, {min: 1, max: 100000},
        {min: 0, max: 10000}, {min: 0, max: Infinity}, {min: 0, max: '100000'}])('rejects invalid magnitude %j', range => {
        expect(() => validateMagnitudeRange(range, 'test')).toThrow(GeneratorValidationError);
    });
});
