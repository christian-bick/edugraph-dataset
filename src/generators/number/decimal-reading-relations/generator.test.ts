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

    it('requires one finite mathematical zero profile and rejects extra configuration fields', () => {
        expect(() => generator.generate(null as never)).toThrow(/missing or null/);
        for (const config of [{}, [], 'decimal']) {
            expect(() => generator.generate(config as never)).toThrow(/zeroProfile/);
        }
        const range = createCanonicalNumericRange(5);
        expect(() => generator.generate({zeroProfile: 'legacy', range} as never)).toThrow(/declared zero profile/);
        expect(() => generator.generate({zeroProfile: 'with-zero', range, extra: true} as never)).toThrow(/Only zero and range/);
        for (const invalid of [Object.assign([], {zeroProfile: 'with-zero', range}), Object.assign(() => {}, {zeroProfile: 'with-zero', range})]) {
            expect(() => generator.generate(invalid as never)).toThrow(/Only zero and range/);
        }
        expect(generator.generate({zeroProfile: 'with-zero', range})!.data.source.wholePart).toBe(0);
    });

    it('constructs the requested nonzero whole range even at the lowest random endpoint', () => {
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({zeroProfile: 'without-zero', range: createCanonicalNumericRange(10)})!.data.source.canonicalNumeral).toBe('5.1');
        expect(draw).toHaveBeenCalledTimes(3);
    });

    it('preserves all fractional comparison sets, reflecting only at the fractional boundary', () => {
        for (let whole = 0; whole <= 9; whole++) for (let fraction = 1; fraction <= 999; fraction++) {
            const source = decimal(fraction, whole);
            const state = getRandomState();
            const data = buildDecimalReadingRelation(source);
            const range = createCanonicalNumericRange(whole < 5 ? 5 : 10);
            expect(hasCanonicalRangeWitness([whole, source.fractionalPart.numerator / source.fractionalPart.denominator,
                source.valueInThousandths / 1000, ...data.comparisonValues.map(value => value / 1000)], range)).toBe(true);
            expect(data.source).toBe(source);
            expect(getRandomState()).toBe(state);
            expect(new Set([source.valueInThousandths, ...data.comparisonValues]).size).toBe(4);
            data.comparisonValues.forEach((value, index) => {
                expect(value).toBeGreaterThan(whole * 1000);
                expect(value).toBeLessThan((whole + 1) * 1000);
                expect(Math.abs(value - source.valueInThousandths)).toBe([1, 10, 100][index]);
            });
        }
        expect(buildDecimalReadingRelation(decimal(199)).comparisonValues).toEqual([5200, 5209, 5299]);
        expect(buildDecimalReadingRelation(decimal(999)).comparisonValues).toEqual([5998, 5989, 5899]);
    });

    it('uses the same settled name-writing profiles and does not draw entropy for alternatives', () => {
        const writing = new DecimalWritingGenerator();
        for (const [zeroProfile, upper] of [['with-zero', 5], ['without-zero', 5], ['without-zero', 10]] as const) for (let seed = 0; seed < 512; seed++) {
            const range = createCanonicalNumericRange(upper);
            setSeed(seed);
            const expected = writing.generate({notationFamily: Area.NumberNameNotation, zeroProfile, range})!;
            const state = getRandomState();
            setSeed(seed);
            const actual = generator.generate({zeroProfile, range})!;
            expect(actual.data.source).toEqual(expected.data);
            expect(getRandomState()).toBe(state);
            expect(actual).not.toHaveProperty('labels');
            expect(actual.data).not.toHaveProperty('correct');
            expect(actual.data).not.toHaveProperty('answer');
            expect(actual.data.source.wholePart === 0).toBe(zeroProfile === 'with-zero');
        }
    });
});
