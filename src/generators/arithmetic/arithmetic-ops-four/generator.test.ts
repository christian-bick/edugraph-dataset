import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticOpsFourGenerator} from './generator.ts';

describe('ArithmeticOpsFourGenerator', () => {
    const generator = new ArithmeticOpsFourGenerator();

    it('strictly validates its range', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates four two-digit addends whose sum stays within 100', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 10, max: 100}})!.data;
            const operands = [data.num1, data.num2, data.num3, data.num4];
            expect(operands.every(value => value >= 10 && value <= 99)).toBe(true);
            expect(data.answer).toBe(operands.reduce((sum, value) => sum + value, 0));
            expect(data.answer).toBeLessThanOrEqual(100);
        }
    });

    it('returns null when four two-digit addends cannot fit', () => {
        expect(generator.generate({range: {min: 30, max: 100}})).toBeNull();
    });
});
