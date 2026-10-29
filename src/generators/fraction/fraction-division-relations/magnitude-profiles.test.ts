import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const denominators = [2, 3, 4, 6];
const roles = ['fraction-by-fraction', 'fraction-by-integer', 'integer-by-fraction'] as const;
const midpoint = (value: number, minimum: number, maximum: number) => (value - minimum + 0.5) / (maximum - minimum + 1);
const denominatorWeights = (proper: boolean, dividend: boolean) => denominators.map(denominator => {
    const total = 4 * denominator + (dividend ? 1 : 0);
    const count = proper ? denominator - (dividend ? 0 : 1) : 3 * denominator + 1;
    return count / total;
});
const denominatorDraw = (denominator: number, proper: boolean, dividend: boolean) => {
    const weights = denominatorWeights(proper, dividend);
    const index = denominators.indexOf(denominator);
    return (weights.slice(0, index).reduce((sum, weight) => sum + weight, 0) + weights[index]! / 2)
        / weights.reduce((sum, weight) => sum + weight, 0);
};

describe.each(roles)('division magnitude support for %s', role => {
    it.each([true, false])('uses the exact conditional denominator intervals for proper=%s', proper => {
        const generator = new FractionDivisionRelationsGenerator();
        const random = vi.spyOn(rng, 'random');
        const classifyDividend = role !== 'integer-by-fraction';
        const weights = denominatorWeights(proper, classifyDividend);
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let before = 0;
        for (let index = 0; index < denominators.length; index++) {
            const lower = before / total;
            const upper = (before + weights[index]!) / total;
            for (const draw of [lower + 1e-10, upper - 1e-10]) {
                random.mockReset().mockReturnValueOnce(draw);
                if (role === 'fraction-by-fraction') random.mockReturnValueOnce(0);
                random.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0);
                const data = generator.generate({operandProfile: `${role}-${proper ? 'proper' : 'improper'}`,
                    withEquation: false, withMultiplication: false}).data;
                expect((classifyDividend ? data.dividend : data.divisor).denominator).toBe(denominators[index]);
            }
            before += weights[index]!;
        }
    });

    it('retains every old original-operand pair in exactly one magnitude profile with its conditional probability', () => {
        const generator = new FractionDivisionRelationsGenerator();
        const random = vi.spyOn(rng, 'random');
        const classifyDividend = role !== 'integer-by-fraction';
        const firstDenominators = classifyDividend ? denominators : [1];
        const secondDenominators = role === 'fraction-by-integer' ? [1] : denominators;
        let count = 0, zeros = 0, oldMass = 0;
        const profileCounts = [0, 0];
        const seen = new Set<string>();
        for (const firstDenominator of firstDenominators) for (const secondDenominator of secondDenominators) {
            for (let first = 0; first <= 4 * firstDenominator; first++) {
                for (let second = 1; second <= 4 * secondDenominator; second++) {
                    const proper = classifyDividend ? first < firstDenominator : second < secondDenominator;
                    const profile = `${role}-${proper ? 'proper' : 'improper'}` as const;
                    const firstMin = classifyDividend && !proper ? firstDenominator : 0;
                    const firstMax = classifyDividend && proper ? firstDenominator - 1 : 4 * firstDenominator;
                    const secondMin = !classifyDividend && !proper ? secondDenominator : 1;
                    const secondMax = !classifyDividend && proper ? secondDenominator - 1 : 4 * secondDenominator;
                    const draws: number[] = [];
                    if (classifyDividend) draws.push(denominatorDraw(firstDenominator, proper, true));
                    if (role !== 'fraction-by-integer') draws.push(classifyDividend
                        ? (denominators.indexOf(secondDenominator) + 0.5) / denominators.length
                        : denominatorDraw(secondDenominator, proper, false));
                    draws.push(midpoint(first, firstMin, firstMax), midpoint(second, secondMin, secondMax), 0);
                    random.mockReset();
                    for (const draw of draws) random.mockReturnValueOnce(draw);
                    const data = generator.generate({operandProfile: profile, withEquation: false, withMultiplication: false}).data;
                    expect(data.operandProfile).toBe(role);
                    expect(data.dividend).toEqual({numerator: first, denominator: firstDenominator});
                    expect(data.divisor).toEqual({numerator: second, denominator: secondDenominator});
                    const key = `${first}/${firstDenominator}:${second}/${secondDenominator}`;
                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                    const oldProbability = 1 / firstDenominators.length / secondDenominators.length
                        / (4 * firstDenominator + 1) / (4 * secondDenominator);
                    const retainedShare = denominatorWeights(proper, classifyDividend);
                    const denominatorIndex = denominators.indexOf(classifyDividend ? firstDenominator : secondDenominator);
                    const denominatorProbability = retainedShare[denominatorIndex]!
                        / retainedShare.reduce((sum, weight) => sum + weight, 0);
                    const conditionalProbability = denominatorProbability
                        / (classifyDividend ? secondDenominators.length : firstDenominators.length)
                        / (firstMax - firstMin + 1) / (secondMax - secondMin + 1);
                    const totalProfileShare = retainedShare.reduce((sum, weight) => sum + weight, 0) / denominators.length;
                    expect(conditionalProbability).toBeCloseTo(oldProbability / totalProfileShare, 14);
                    oldMass += oldProbability;
                    profileCounts[proper ? 0 : 1] = profileCounts[proper ? 0 : 1]! + 1;
                    if (first === 0) zeros++;
                    count++;
                }
            }
        }
        expect(oldMass).toBeCloseTo(1, 12);
        expect(count).toBe(role === 'fraction-by-fraction' ? 3840 : role === 'fraction-by-integer' ? 256 : 300);
        expect(profileCounts).toEqual(role === 'fraction-by-fraction' ? [900, 2940]
            : role === 'fraction-by-integer' ? [60, 196] : [55, 245]);
        expect(zeros).toBe(role === 'fraction-by-fraction' ? 240 : role === 'fraction-by-integer' ? 16 : 60);
    });
});
