import {Area} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import * as random from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {DecimalWritingGenerator} from '../decimal-writing/generator.ts';
import {buildDecimalReadingRelation, DecimalReadingRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

const decimal = (fraction: number, wholePart = 5): DecimalWritingProblem => {
    const tenth = Math.floor(fraction / 100), hundredth = Math.floor(fraction / 10) % 10, thousandth = fraction % 10;
    const fractionalPart: DecimalWritingProblem['fractionalPart'] = fraction % 100 === 0
        ? {precision: 'tenths', digits: [tenth, 0, 0], numerator: fraction / 100, denominator: 10}
        : fraction % 10 === 0
            ? {precision: 'hundredths', digits: [tenth, hundredth, 0], numerator: fraction / 10, denominator: 100}
            : {precision: 'thousandths', digits: [tenth, hundredth, thousandth], numerator: fraction, denominator: 1000};
    const scale = fractionalPart.precision === 'tenths' ? 1 : fractionalPart.precision === 'hundredths' ? 2 : 3;
    return {kind: 'decimal-writing', base: 10, wholePart, valueInThousandths: wholePart * 1000 + fraction,
        canonicalNumeral: `${wholePart}.${String(fraction).padStart(3, '0').slice(0, scale)}`, fractionalPart};
};

describe('DecimalReadingRelationsGenerator', () => {
    const generator = new DecimalReadingRelationsGenerator();

    it('requires one finite value range and rejects retired or extra configuration fields', () => {
        expect(() => generator.generate(null as never)).toThrow(/missing or null/);
        for (const config of [{}, [], 'decimal']) {
            expect(() => generator.generate(config as never)).toThrow(/range/);
        }
        const range = createCanonicalNumericRange(5);
        expect(() => generator.generate({zeroProfile: 'legacy', range} as never)).toThrow(/Only a range/);
        expect(() => generator.generate({range, extra: true} as never)).toThrow(/Only a range/);
        for (const invalid of [Object.assign([], {range}), Object.assign(() => {}, {range})]) {
            expect(() => generator.generate(invalid as never)).toThrow(/Only a range/);
        }
        expect(generator.generate({range})!.data.source.valueInThousandths).toBeGreaterThan(0);
    });

    it('constructs the requested nonzero whole range even at the lowest random endpoint', () => {
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({range: createCanonicalNumericRange(10, 5)})!.data.source.canonicalNumeral).toBe('5.1');
        expect(draw).toHaveBeenCalledTimes(3);
    });

    it.each(Array.from({length: 10}, (_, whole) => whole))('preserves all999 fractional comparison sets for whole%s, reflecting only at the boundary', whole => {
        for (let fraction = 1; fraction <= 999; fraction++) {
            const source = decimal(fraction, whole);
            const state = getRandomState();
            const data = buildDecimalReadingRelation(source);
            const range = createCanonicalNumericRange(whole < 5 ? 5 : 10, whole < 5 ? 0 : 5);
            expect(hasCanonicalRangeWitness([source.valueInThousandths / 1000,
                ...data.comparisonValues.map(value => value / 1000)], range)).toBe(true);
            expect(data.source).toBe(source);
            expect(getRandomState()).toBe(state);
            expect(new Set([source.valueInThousandths, ...data.comparisonValues]).size).toBe(4);
            data.comparisonValues.forEach((value, index) => {
                expect(value).toBeGreaterThan(whole * 1000);
                expect(value).toBeLessThan((whole + 1) * 1000);
                expect(Math.abs(value - source.valueInThousandths)).toBe([1, 10, 100][index]);
            });
        }
    });

    it('retains the exact neighboring-value and boundary-reflection examples', () => {
        expect(buildDecimalReadingRelation(decimal(199)).comparisonValues).toEqual([5200, 5209, 5299]);
        expect(buildDecimalReadingRelation(decimal(999)).comparisonValues).toEqual([5998, 5989, 5899]);
    });

    it.each([createCanonicalNumericRange(5), createCanonicalNumericRange(10, 5)])('uses the same complete-value source law and no entropy for alternatives in%j', range => {
        const writing = new DecimalWritingGenerator();
        for (let seed = 0; seed < 512; seed++) {
            setSeed(seed);
            const expected = writing.generate({notationFamily: Area.NumberNameNotation, range})!;
            const state = getRandomState();
            setSeed(seed);
            const actual = generator.generate({range})!;
            expect(actual.data.source).toEqual(expected.data);
            expect(getRandomState()).toBe(state);
            expect(actual).not.toHaveProperty('labels');
            expect(actual.data).not.toHaveProperty('correct');
            expect(actual.data).not.toHaveProperty('answer');
            expect(actual.data.source.valueInThousandths).toBeGreaterThan(0);
        }
    });
});
