import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';

const generator = new ArithmeticOpsPairsGenerator();
const base = {operation: Area.Addition as const, range: createCanonicalNumericRange(20), largestOperandDigits: 1 as const,
    requireZero: false, requireNegative: false, requireMultipleOf10: false, requireEqualAddends: false, requireEvenResult: false};

describe('ArithmeticOpsPairsGenerator', () => {
    it('validates every required configuration field', () => {
        for (const field of Object.keys(base)) {
            const config = {...base}; delete config[field as keyof typeof base];
            expect(() => generator.generate(config)).toThrow();
        }
        expect(() => generator.generate({} as never)).toThrow();
    });
    it('retains the canonical payload type and rejects unsupported operations or empty profiles', () => {
        expect(generator.type).toBe('arithmetic');
        expect(generator.generate({...base, operation: 'unsupported'})).toBeNull();
        expect(generator.generate({...base, operation: 'unknown'} as never)).toBeNull();
        expect(generator.generate({...base, range: createCanonicalNumericRange(1000, 10), largestOperandDigits: 2})).toBeNull();
    });
    it.each([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const)('constructs canonical %s values', operation => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const config = {...base, operation, range: createCanonicalNumericRange(100), largestOperandDigits: 2 as const};
            const data = generator.generate(config)!.data;
            expect(hasCanonicalRangeWitness([data.num1, data.num2, data.answer], config.range)).toBe(true);
        }
    });
    it('retains both the small-subtrahend and small-difference source classes', () => {
        const samples = Array.from({length: 200}, (_, seed) => {
            setSeed(seed);
            return generator.generate({...base, operation: Area.Subtraction, largestOperandDigits: 2})!.data;
        });
        expect(samples.some(data => data.num2 > data.answer)).toBe(true);
        expect(samples.some(data => data.num2 < data.answer)).toBe(true);
        expect(samples.some(data => data.answer === 2 && data.num2 >= 10)).toBe(true);
    });
    it('preserves cancellation and zero-operand forms in signed zero exercises', () => {
        const samples = Array.from({length: 80}, (_, seed) => {
            setSeed(seed);
            return generator.generate({...base, range: createCanonicalNumericRange(5), requireZero: true, requireNegative: true})!.data;
        });
        expect(samples.some(data => data.answer === 0 && data.num1 !== 0 && data.num2 !== 0)).toBe(true);
        expect(samples.some(data => data.num1 === 0 || data.num2 === 0)).toBe(true);
    });
});
