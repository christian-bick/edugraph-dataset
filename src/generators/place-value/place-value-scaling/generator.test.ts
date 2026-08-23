import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueScalingProblem} from '../../../types/problems.ts';
import {PlaceValueScalingGenerator} from './generator.ts';

const PLACE_NAMES = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands'
] as const;

const expectValidScaling = (problem: PlaceValueScalingProblem): void => {
    expect(problem.task).toBe('adjacent-place-scaling');
    expect(problem.number).toBeGreaterThanOrEqual(100000);
    expect(problem.number).toBeLessThan(1000000);
    expect(problem.digits).toHaveLength(6);
    expect(problem.digits.reduce((value, digit) => value * 10 + digit, 0))
        .toBe(problem.number);
    expect(problem.repeatedDigit).toBeGreaterThanOrEqual(1);
    expect(problem.repeatedDigit).toBeLessThanOrEqual(9);
    expect(problem.digits.filter(digit => digit === problem.repeatedDigit)).toHaveLength(2);

    expect(problem.rightPlace.digitIndex).toBe(problem.leftPlace.digitIndex + 1);
    expect(problem.leftPlace.exponent).toBe(problem.rightPlace.exponent + 1);
    expect(problem.leftPlace.name).toBe(PLACE_NAMES[problem.leftPlace.exponent]);
    expect(problem.rightPlace.name).toBe(PLACE_NAMES[problem.rightPlace.exponent]);
    expect(problem.digits[problem.leftPlace.digitIndex]).toBe(problem.repeatedDigit);
    expect(problem.digits[problem.rightPlace.digitIndex]).toBe(problem.repeatedDigit);
    expect(problem.leftPlace.value).toBe(
        problem.repeatedDigit * 10 ** problem.leftPlace.exponent
    );
    expect(problem.rightPlace.value).toBe(
        problem.repeatedDigit * 10 ** problem.rightPlace.exponent
    );
    expect(problem.leftPlace.value).toBe(problem.rightPlace.value * 10);
    expect(problem.scaleFactor).toBe(10);
};

describe('PlaceValueScalingGenerator', () => {
    const generator = new PlaceValueScalingGenerator();

    it('strictly requires a configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('constructs exact adjacent place-value scaling evidence below one million', () => {
        const exponents = new Set<number>();
        const repeatedDigits = new Set<number>();

        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const problem = generator.generate({}).data;
            expectValidScaling(problem);
            exponents.add(problem.rightPlace.exponent);
            repeatedDigits.add(problem.repeatedDigit);
        }

        expect(exponents).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(repeatedDigits).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('is deterministic under the project RNG', () => {
        setSeed('place-value-scaling');
        const first = generator.generate({});
        setSeed('place-value-scaling');
        const second = generator.generate({});

        expect(second).toEqual(first);
    });
});
