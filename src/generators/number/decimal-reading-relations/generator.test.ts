import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {DecimalWritingGenerator} from '../decimal-writing/generator.ts';
import {buildDecimalReadingRelation, DecimalReadingRelationsGenerator} from './generator.ts';

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

    it('validates its fixed domain without adding a dummy configuration choice', () => {
        expect(() => generator.generate(null as never)).toThrow(/missing or null/);
        for (const config of [[], 'decimal', {zeroProfile: 'legacy'}]) {
            expect(() => generator.generate(config as never)).toThrow(/no configuration/);
        }
        expect(generator.generate({}).data.kind).toBe('decimal-reading-relation');
    });

    it('preserves all fractional comparison sets, reflecting only at the fractional boundary', () => {
        for (let fraction = 1; fraction <= 999; fraction++) {
            const source = decimal(fraction);
            const state = getRandomState();
            const data = buildDecimalReadingRelation(source);
            expect(data.source).toBe(source);
            expect(getRandomState()).toBe(state);
            expect(new Set([source.valueInThousandths, ...data.comparisonValues]).size).toBe(4);
            data.comparisonValues.forEach((value, index) => {
                expect(value).toBeGreaterThan(5000);
                expect(value).toBeLessThan(6000);
                expect(Math.abs(value - source.valueInThousandths)).toBe([1, 10, 100][index]);
            });
        }
        expect(buildDecimalReadingRelation(decimal(199)).comparisonValues).toEqual([5200, 5209, 5299]);
        expect(buildDecimalReadingRelation(decimal(999)).comparisonValues).toEqual([5998, 5989, 5899]);
    });

    it('retains the complete old source sampler and its random continuation', () => {
        const oldDomain = new DecimalWritingGenerator();
        for (let seed = 0; seed < 1024; seed++) {
            setSeed(seed);
            const expected = oldDomain.generate({notationFamily: Area.DecimalNotation, zeroProfile: 'legacy'})!;
            const state = getRandomState();
            setSeed(seed);
            const actual = generator.generate({});
            expect(actual.data.source).toEqual(expected.data);
            expect(getRandomState()).toBe(state);
            expect(actual).not.toHaveProperty('labels');
            expect(actual.data).not.toHaveProperty('correct');
            expect(actual.data).not.toHaveProperty('answer');
        }
    });
});
