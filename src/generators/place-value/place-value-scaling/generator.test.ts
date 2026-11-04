import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {PlaceValueScalingProblem} from '../../../types/problems.ts';
import {PlaceValueScalingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'] as const;
const profiles = [0, 5, 10].map(lower => ({range: createCanonicalNumericRange(1000000, lower)}));

const expectValidScaling = (problem: PlaceValueScalingProblem): void => {
    expect(problem.task).toBe('adjacent-place-scaling');
    expect(problem.number).toBeGreaterThanOrEqual(100000);
    expect(problem.number).toBeLessThan(1000000);
    expect(problem.digits).toHaveLength(6);
    expect(problem.digits.reduce((value, digit) => value * 10 + digit, 0)).toBe(problem.number);
    expect(problem.digits.filter(digit => digit === problem.repeatedDigit)).toHaveLength(2);
    expect(problem.rightPlace.digitIndex).toBe(problem.leftPlace.digitIndex + 1);
    expect(problem.leftPlace.exponent).toBe(problem.rightPlace.exponent + 1);
    for (const place of [problem.leftPlace, problem.rightPlace]) {
        expect(place.name).toBe(PLACE_NAMES[place.exponent]);
        expect(problem.digits[place.digitIndex]).toBe(problem.repeatedDigit);
        expect(place.value).toBe(problem.repeatedDigit * 10 ** place.exponent);
    }
    expect(problem.leftPlace.value).toBe(problem.rightPlace.value * 10);
    expect(problem.scaleFactor).toBe(10);
};

/** Invert the original independent digit proposals for a native six-digit vector. */
const drawsFor = (digits: readonly number[], left: number): number[] => {
    const repeated = digits[left]!, lower = left < 4 ? 10 : repeated >= 5 ? 5 : 0;
    const first = lower === 5 ? 5 : 1, repeatCount = lower === 0 ? 4 : lower === 5 ? 5 : 9;
    const draws = [(repeated - first + 0.5) / repeatCount, lower < 10 ? 0.5 : (left + 0.5) / 4];
    for (let index = 0; index < 6; index++) {
        if (index === left || index === left + 1) continue;
        const minimum = index === 0 ? 1 : 0;
        const choices = Array.from({length: 10 - minimum}, (_, i) => i + minimum)
            .filter(digit => digit !== repeated);
        draws.push((choices.indexOf(digits[index]!) + 0.5) / choices.length);
    }
    return draws;
};

describe('PlaceValueScalingGenerator', () => {
    const generator = new PlaceValueScalingGenerator();

    it('rejects missing, malformed and noncanonical configurations before drawing', () => {
        const draw = vi.spyOn(rng, 'random'), valid = profiles[0]!;
        for (const config of [null, {}, {range: false}, {range: createCanonicalNumericRange(100000)},
            {range: {...valid.range, min: 20}}, {range: {...valid.range, maximumAbove: 1000}},
            {range: {...valid.range, minimumBelow: 10}}, {hasZeroCoefficient: false, coefficientMinimum: 1}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        expect(draw).not.toHaveBeenCalled();
    });

    it.each(profiles)('constructs exact scaling quantities for %j', config => {
        const repeated = new Set<number>(), positions = new Set<number>(), zeroStates = new Set<boolean>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(seed);
            const data = generator.generate(config).data;
            expectValidScaling(data);
            const quantities = [data.number, data.leftPlace.value, data.rightPlace.value, data.scaleFactor];
            expect(Math.min(...quantities)).toBeGreaterThanOrEqual(config.range.min);
            expect(Math.min(...quantities)).toBeLessThan(config.range.minimumBelow);
            expect(Math.max(...quantities)).toBeGreaterThan(config.range.maximumAbove);
            expect(Math.max(...quantities)).toBeLessThan(config.range.max);
            expect(quantities.every(value => value > 0)).toBe(true);
            repeated.add(data.repeatedDigit);
            positions.add(data.leftPlace.digitIndex);
            zeroStates.add(data.digits.includes(0));
        }
        expect(positions).toEqual(config.range.min < 10 ? new Set([4]) : new Set([0, 1, 2, 3]));
        expect(repeated).toEqual(new Set(config.range.min === 0 ? [1, 2, 3, 4]
            : config.range.min === 5 ? [5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9]));
        expect(zeroStates).toEqual(new Set([false, true]));
    });

    it('is deterministic and always consumes six draws without retry', () => {
        for (const config of profiles) {
            setSeed('place-value-scaling');
            const first = generator.generate(config);
            setSeed('place-value-scaling');
            expect(generator.generate(config)).toEqual(first);
            const draw = vi.spyOn(rng, 'random').mockReturnValue(0.5);
            generator.generate(config);
            expect(draw).toHaveBeenCalledTimes(6);
            draw.mockRestore();
        }
    });

    it('preserves every repeated digit, adjacent position and incidental zero pattern', () => {
        const random = vi.spyOn(rng, 'random');
        for (let repeated = 1; repeated <= 9; repeated++) for (let left = 0; left < 5; left++) {
            const free = [1, 2, 3, 4, 5].filter(index => index !== left && index !== left + 1);
            for (let mask = 0; mask < 2 ** free.length; mask++) {
                const digits = Array.from({length: 6}, (_, index) => index === left || index === left + 1
                    ? repeated : index > 0 && (mask & (1 << free.indexOf(index))) ? 0 : repeated === 9 ? 8 : 9);
                const inputs = drawsFor(digits, left), lower = left < 4 ? 10 : repeated >= 5 ? 5 : 0;
                random.mockReset().mockImplementation(() => inputs.shift()!);
                const data = generator.generate({range: createCanonicalNumericRange(1000000, lower)}).data;
                expectValidScaling(data);
                expect(data.digits).toEqual(digits);
                expect(inputs).toHaveLength(0);
                expect(random).toHaveBeenCalledTimes(6);
            }
        }
    });

    it('ignores passive digit glyphs when assigning range and zero quantities', () => {
        const random = vi.spyOn(rng, 'random');
        for (const digits of [[5, 5, 6, 7, 8, 9], [5, 5, 0, 7, 8, 9], [5, 5, 1, 2, 3, 4]]) {
            const inputs = drawsFor(digits, 0);
            random.mockReset().mockImplementation(() => inputs.shift()!);
            const data = generator.generate({range: createCanonicalNumericRange(1000000, 10)}).data;
            expect(data.digits).toEqual(digits);
            expect(Math.min(data.number, data.leftPlace.value, data.rightPlace.value, data.scaleFactor)).toBe(10);
        }
    });

    it('partitions every original native vector and preserves its exact conditional proposal mass', () => {
        const cells = new Map<number, {count: number; weight: number}>();
        const expectedMass: Record<number, number> = {0: 209952, 5: 262440, 10: 1889568};
        let correctMass = true;
        for (let repeated = 1; repeated <= 9; repeated++) for (let left = 0; left < 5; left++) {
            const free = [0, 1, 2, 3, 4, 5].filter(index => index !== left && index !== left + 1);
            for (let code = 0; code < 9 ** 4; code++) {
                const digits = [repeated, repeated, repeated, repeated, repeated, repeated];
                let rest = code;
                for (const index of free) {
                    const choice = rest % 9;
                    rest = Math.floor(rest / 9);
                    digits[index] = choice >= repeated ? choice + 1 : choice;
                }
                if (digits[0] === 0) continue;
                const lower = left < 4 ? 10 : repeated >= 5 ? 5 : 0, weight = left === 0 ? 8 : 9;
                const cell = cells.get(lower) ?? {count: 0, weight: 0};
                cell.count++;
                cell.weight += weight;
                cells.set(lower, cell);
                // Original proposal is repeat/9, pair/5, four independent free digits.
                // Conditioning on the floor gives these exact independent domain sizes.
                const denominator = (lower === 0 ? 4 : lower === 5 ? 5 : 9) * (lower < 10 ? 1 : 4)
                    * free.reduce((product, index) => product * (index === 0 ? 8 : 9), 1);
                if (denominator * weight !== expectedMass[lower]) correctMass = false;
            }
        }
        expect(Object.fromEntries(cells)).toEqual({0: {count: 23328, weight: 209952},
            5: {count: 29160, weight: 262440}, 10: {count: 216513, weight: 1889568}});
        expect(correctMass).toBe(true);
    });

    it('honors both exact random endpoints for every profile', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const config of profiles) for (const endpoint of [0, (2 ** 32 - 1) / 2 ** 32]) {
            draw.mockReset().mockReturnValue(endpoint);
            const data = generator.generate(config).data;
            expectValidScaling(data);
            expect(Math.min(data.rightPlace.value, 10)).toBeGreaterThanOrEqual(config.range.min);
            expect(Math.min(data.rightPlace.value, 10)).toBeLessThan(config.range.minimumBelow);
            expect(draw).toHaveBeenCalledTimes(6);
        }
    });
});
