import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {PlaceValueScalingProblem} from '../../../types/problems.ts';
import {PlaceValueScalingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

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
            const hasZeroCoefficient = seed % 2 === 0;
            const problem = generator.generate({hasZeroCoefficient}).data;
            expectValidScaling(problem);
            expect(problem.digits.includes(0)).toBe(hasZeroCoefficient);
            exponents.add(problem.rightPlace.exponent);
            repeatedDigits.add(problem.repeatedDigit);
        }

        expect(exponents).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(repeatedDigits).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('is deterministic under the project RNG', () => {
        setSeed('place-value-scaling');
        const first = generator.generate({hasZeroCoefficient: true});
        setSeed('place-value-scaling');
        const second = generator.generate({hasZeroCoefficient: true});

        expect(second).toEqual(first);
    });

    it('rejects missing and malformed coefficient profiles', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({hasZeroCoefficient: 'yes'} as never)).toThrow();
    });

    it('preserves every zero pattern, repeated digit and adjacent position', () => {
        const random = vi.spyOn(rng, 'random');
        const middle = (weights: number[], index: number) =>
            (weights.slice(0, index).reduce((sum, value) => sum + value, 0) + weights[index]! / 2)
                / weights.reduce((sum, value) => sum + value, 0);
        for (let repeatedDigit = 1; repeatedDigit <= 9; repeatedDigit++) {
            for (let left = 0; left < 5; left++) {
                const otherPlaces = [1, 2, 3, 4, 5].filter(index => index !== left && index !== left + 1);
                for (let mask = 0; mask < 2 ** otherPlaces.length; mask++) {
                    const zeroPlaces = otherPlaces.filter((_, index) => mask & (1 << index));
                    const hasZeroCoefficient = mask !== 0;
                    const positionWeights = [0, 1, 2, 3, 4].map(index => {
                        const absence = (8 / 9) ** (index === 0 ? 4 : 3);
                        return hasZeroCoefficient ? 1 - absence : absence;
                    });
                    const firstZero = zeroPlaces[0] ?? -1;
                    const choices = [(repeatedDigit - 0.5) / 9, middle(positionWeights, left)];
                    if (hasZeroCoefficient) choices.push(middle(otherPlaces.map((_, index) =>
                        8 ** index * 9 ** (otherPlaces.length - index - 1)), otherPlaces.indexOf(firstZero)));
                    for (let index = 0; index < 6; index++) {
                        if (index === left || index === left + 1 || index === firstZero) continue;
                        const positive = index === 0 || !hasZeroCoefficient || index < firstZero;
                        // Exercise a later zero or the largest positive choice in its original domain.
                        choices.push(zeroPlaces.includes(index) ? 0.5 / 9 : 1 - Number.EPSILON);
                        expect(positive && zeroPlaces.includes(index)).toBe(false);
                    }
                    random.mockReset().mockImplementation(() => choices.shift()!);
                    const problem = generator.generate({hasZeroCoefficient}).data;
                    expectValidScaling(problem);
                    expect(problem.leftPlace.digitIndex).toBe(left);
                    expect(problem.repeatedDigit).toBe(repeatedDigit);
                    expect(problem.digits.flatMap((digit, index) => digit === 0 ? [index] : [])).toEqual(zeroPlaces);
                    expect(choices).toHaveLength(0);
                }
            }
        }
    });
});
