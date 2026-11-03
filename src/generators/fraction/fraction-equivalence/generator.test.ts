import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {equivalentPairs} from './domain.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
afterEach(() => vi.restoreAllMocks());

describe('proper-fraction equivalence', () => {
    const generator = new FractionEquivalenceGenerator();
    it('rejects missing or malformed constraints', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: true} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: 'yes', usesProportionalScaling: false, range: createCanonicalNumericRange(5)} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: true, usesProportionalScaling: 'yes', range: createCanonicalNumericRange(5)} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: false, usesProportionalScaling: false, range: createCanonicalNumericRange(20)})).toThrow();
    });
    it.each([
        {usesMultiplication: false, usesProportionalScaling: false},
        {usesMultiplication: true, usesProportionalScaling: false},
        {usesMultiplication: false, usesProportionalScaling: true},
        {usesMultiplication: true, usesProportionalScaling: true}
    ])('scales both fraction terms with exact unit multiplier for %o', config => {
        const factors = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const range = createCanonicalNumericRange(seed % 2 ? 10 : 5);
            const data = generator.generate({...config, range}).data;
            expect(data.first.numerator).toBeGreaterThan(0);
            expect(data.first.numerator).toBeLessThan(data.first.denominator);
            expect(data.second.numerator).toBe(data.first.numerator * data.scaleFactor);
            expect(data.second.denominator).toBe(data.first.denominator * data.scaleFactor);
            expect(data.unitMultiplier).toEqual({
                numerator: data.scaleFactor,
                denominator: data.scaleFactor,
                value: 1
            });
            expect(data.first.numerator * data.second.denominator)
                .toBe(data.second.numerator * data.first.denominator);
            expect([2, 3, 4, 6, 8]).toContain(data.second.denominator);
            factors.add(data.scaleFactor);
            expect(data.second.denominator).toBeLessThanOrEqual(range.max);
            expect(data.second.denominator).toBeGreaterThan(range.maximumAbove);
        }
        expect([...factors].sort()).toEqual([2, 3, 4]);
    });
    it.each([5, 10])('selects uniformly from every native outcome in upper%s with one draw', upper => {
        const range = createCanonicalNumericRange(upper), pairs = equivalentPairs(range), draw = vi.spyOn(rng, 'random');
        for (const usesMultiplication of [false, true]) for (const usesProportionalScaling of [false, true]) {
            for (const [index, pair] of pairs.entries()) {
                draw.mockReturnValueOnce((index + 0.5) / pairs.length);
                const before = draw.mock.calls.length;
                const stub = generator.generate({usesMultiplication, usesProportionalScaling, range});
                expect(draw.mock.calls.length - before).toBe(1);
                expect(Object.keys(stub)).toEqual(['data']);
                expect(stub.data).toEqual({task: 'relate-equivalent-fractions',
                    first: {numerator: pair.firstNumerator, denominator: pair.firstDenominator},
                    second: {numerator: pair.firstNumerator * pair.scaleFactor, denominator: pair.firstDenominator * pair.scaleFactor},
                    scaleFactor: pair.scaleFactor,
                    unitMultiplier: {numerator: pair.scaleFactor, denominator: pair.scaleFactor, value: 1}, relation: 'equal'});
            }
        }
    });
    it('replays the same mathematical relation for the same seed', () => {
        setSeed('proper-equivalence');
        const range = createCanonicalNumericRange(10);
        const first = generator.generate({usesMultiplication: true, usesProportionalScaling: true, range});
        const state = rng.getRandomState();
        setSeed('proper-equivalence');
        expect(generator.generate({usesMultiplication: true, usesProportionalScaling: true, range})).toEqual(first);
        expect(rng.getRandomState()).toBe(state);
        setSeed('proper-equivalence');
        expect(generator.generate({usesMultiplication: false, usesProportionalScaling: false, range})).toEqual(first);
        expect(rng.getRandomState()).toBe(state);
    });
});
