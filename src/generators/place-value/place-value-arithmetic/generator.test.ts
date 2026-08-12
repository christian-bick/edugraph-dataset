import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';

describe('PlaceValueArithmeticGenerator', () => {
    const generator = new PlaceValueArithmeticGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it.each([Area.Addition, Area.Subtraction] as const)('generates visible ones-place regrouping for %s', operation => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generator.generate({operation, range: {min: 1, max: 1000}})!.data;
            expect(data.answer).toBe(operation === Area.Addition ? data.num1 + data.num2 : data.num1 - data.num2);
            expect(data.answer).toBeGreaterThanOrEqual(0);
            expect(data.answer).toBeLessThanOrEqual(999);
            expect(data.regrouping).toMatch(/regroup/i);
            expect(data.strategySteps).toHaveLength(3);
            if (operation === Area.Addition) expect(data.num1 % 10 + data.num2 % 10).toBeGreaterThanOrEqual(10);
            else expect(data.num1 % 10).toBeLessThan(data.num2 % 10);
        }
    });
});
