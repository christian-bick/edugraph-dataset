import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {StandardUnitEquivalencesProblem} from '../../../types/problems.ts';
import {MeasurementConversionGenerator} from './generator.ts';

const pairCases = [
    ['kilometer-meter', 'length', 'magnitude', 'kilometer', 'meter', 1000],
    ['meter-centimeter', 'length', 'magnitude', 'meter', 'centimeter', 100],
    ['kilogram-gram', 'weight', 'magnitude', 'kilogram', 'gram', 1000],
    ['pound-ounce', 'weight', 'factor', 'pound', 'ounce', 16],
    ['liter-milliliter', 'liquid-volume', 'magnitude', 'liter', 'milliliter', 1000],
    ['hour-minute', 'time', 'factor', 'hour', 'minute', 60],
    ['minute-second', 'time', 'factor', 'minute', 'second', 60]
] as const;

const expectConsistentProblem = (problem: StandardUnitEquivalencesProblem): void => {
    const expected = pairCases.find(([id]) => id === problem.pair.id)!;
    expect([
        problem.pair.id, problem.pair.quantityKind, problem.pair.scalingKind,
        problem.pair.largerUnit, problem.pair.smallerUnit, problem.pair.factor
    ]).toEqual(expected);
    expect(problem.equivalents).toHaveLength(5);
    const start = problem.equivalents[0]!.largerValue;
    expect(start).toBeGreaterThanOrEqual(2);
    expect(start).toBeLessThanOrEqual(9);
    problem.equivalents.forEach((equivalent, index) => {
        expect(equivalent).toEqual({
            largerValue: start + index,
            smallerValue: (start + index) * problem.pair.factor
        });
    });
};

describe('MeasurementConversionGenerator', () => {
    const generator = new MeasurementConversionGenerator();

    it('strictly validates unit-pair configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({unitPair: 'kilometer-meter'})).toThrow();
        expect(() => generator.generate({unitPair: 'yard-foot', numericProfile: 'legacy'} as never))
            .toThrow('Unsupported unit pair "yard-foot".');
        expect(() => generator.generate({unitPair: 'kilometer-meter', numericProfile: 'fraction'} as never))
            .toThrow('Unsupported numeric profile "fraction".');
    });

    it.each(pairCases)('preserves five deterministic legacy equivalences for %s', unitPair => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const first = generator.generate({unitPair, numericProfile: 'legacy'});
            expectConsistentProblem(first.data);
            expect(first.data).not.toHaveProperty('numericExamples');
            setSeed(seed);
            expect(generator.generate({unitPair, numericProfile: 'legacy'})).toEqual(first);
        }
    });

    it('keeps the legacy generator random continuation to one starting-row draw', () => {
        setSeed('conversion-legacy-continuation');
        random();
        const expectedState = getRandomState();
        setSeed('conversion-legacy-continuation');
        generator.generate({unitPair: 'kilometer-meter', numericProfile: 'legacy'});
        expect(getRandomState()).toBe(expectedState);
    });

    it.each(pairCases)('builds two exact and distinct numeric equalities for %s', (unitPair, _kind, _scaling, _larger, _smaller, factor) => {
        for (const numericProfile of ['integer', 'decimal'] as const) {
            for (let seed = 0; seed < 80; seed++) {
                setSeed(`${unitPair}-${numericProfile}-${seed}`);
                const first = generator.generate({unitPair, numericProfile});
                expectConsistentProblem(first.data);
                const examples = first.data.numericExamples!;
                expect(examples.numberKind).toBe(numericProfile);
                expect(examples.equalities).toHaveLength(2);
                expect(examples.equalities[0]!.largerHundredths)
                    .not.toBe(examples.equalities[1]!.largerHundredths);
                for (const equality of examples.equalities) {
                    expect(Number.isSafeInteger(equality.largerHundredths)).toBe(true);
                    expect(Number.isSafeInteger(equality.smallerHundredths)).toBe(true);
                    expect(equality.largerHundredths).toBeGreaterThan(0);
                    expect(equality.smallerHundredths).toBe(equality.largerHundredths * factor);
                    expect(equality.smallerHundredths).toBeLessThanOrEqual(900000);
                    if (numericProfile === 'integer') {
                        expect(equality.largerHundredths % 100).toBe(0);
                        expect(equality.smallerHundredths % 100).toBe(0);
                    } else {
                        expect(equality.largerHundredths % 100).not.toBe(0);
                    }
                }
                setSeed(`${unitPair}-${numericProfile}-${seed}`);
                expect(generator.generate({unitPair, numericProfile})).toEqual(first);
            }
        }
    });

    it('covers familiar fractions and exact factor-specific decimal outcomes', () => {
        const fractions = new Set<number>();
        let fractionalOunces = false;
        let fractionalMinutes = false;
        for (let seed = 0; seed < 500; seed++) {
            setSeed(`conversion-fraction-${seed}`);
            const pounds = generator.generate({unitPair: 'pound-ounce', numericProfile: 'decimal'}).data;
            setSeed(`conversion-fraction-${seed}`);
            const hours = generator.generate({unitPair: 'hour-minute', numericProfile: 'decimal'}).data;
            for (const equality of pounds.numericExamples!.equalities) {
                fractions.add(equality.largerHundredths % 100);
                fractionalOunces ||= equality.smallerHundredths % 100 !== 0;
            }
            fractionalMinutes ||= hours.numericExamples!.equalities.some(
                equality => equality.smallerHundredths % 100 !== 0);
        }
        expect(fractions.has(1)).toBe(true);
        expect(fractions.has(25)).toBe(true);
        expect(fractions.has(50)).toBe(true);
        expect(fractions.has(75)).toBe(true);
        expect(fractionalOunces).toBe(true);
        expect(fractionalMinutes).toBe(true);
    });

    it('reaches the complete starting-quantity range', () => {
        const starts = new Set<number>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const data = generator.generate({unitPair: 'pound-ounce', numericProfile: 'legacy'}).data;
            starts.add(data.equivalents[0]!.largerValue);
        }
        expect(starts).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
    });
});
