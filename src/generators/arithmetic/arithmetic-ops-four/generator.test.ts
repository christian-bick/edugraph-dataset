import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticOpsFourGenerator} from './generator.ts';

describe('ArithmeticOpsFourGenerator', () => {
    const generator = new ArithmeticOpsFourGenerator();
    it('validates its range and rejects empty source cells', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(generator.generate({range: createCanonicalNumericRange(20, 10)})).toBeNull();
    });
    it('constructs all six correlated cells while bounding each operand rather than capping the sum at99', () => {
        for (const lower of [10, 20]) for (const upper of [100, 120, 1000]) for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const range = createCanonicalNumericRange(upper, lower);
            const data = generator.generate({range})!.data;
            const operands = [data.num1, data.num2, data.num3, data.num4];
            expect(operands.every(value => value >= 10 && value <= 99)).toBe(true);
            expect(data.answer).toBe(operands.reduce((sum, value) => sum + value, 0));
            expect(hasCanonicalRangeWitness([...operands, data.answer], range)).toBe(true);
        }
    });
});
