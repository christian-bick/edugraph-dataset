import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {ArithmeticOpsTriplesGenerator} from './generator.ts';

const generator = new ArithmeticOpsTriplesGenerator();
const base = {operation: Area.Addition as const, range: createCanonicalNumericRange(20), requireZero: false,
    requireMultipleOf10: false, requireTwoDigitOperands: false, useCommutativeLaw: false, useAssociativeLaw: false, useDistributiveLaw: false};
describe('ArithmeticOpsTriplesGenerator', () => {
    it('validates required configuration and rejects unsupported operations', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(generator.generate({...base, operation: 'unsupported'})).toBeNull();
        expect(generator.generate({...base, operation: 'unknown'} as never)).toBeNull();
        expect(generator.generate({...base, requireTwoDigitOperands: true, range: createCanonicalNumericRange(20, 10)})).toBeNull();
        expect(generator.type).toBe('arithmetic');
    });
    it('keeps the complete arithmetic payload within its canonical profile', () => {
        const data = generator.generate(base)!.data;
        expect(data.num1 + data.num2 + data.num3).toBe(data.answer);
        expect(hasCanonicalRangeWitness([data.num1, data.num2, data.num3, data.answer], base.range)).toBe(true);
    });
    it('preserves distributive combined factors and partial products', () => {
        const config = {...base, operation: Area.Multiplication as const, useDistributiveLaw: true, range: createCanonicalNumericRange(100)};
        const data = generator.generate(config)!.data;
        expect(data.propertyLaw).toBe('distributive');
        expect(data.combinedFactor).toBe(data.num2 + data.num3);
        expect(data.partialProducts).toEqual([data.num1 * data.num2, data.num1 * data.num3]);
        expect(data.answer).toBe(data.partialProducts!.reduce((a, b) => a + b, 0));
    });
});
