import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
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
        expect(() => generator.generate({unitPair: 'yard-foot'} as never))
            .toThrow('Unsupported unit pair "yard-foot".');
    });

    it.each(pairCases)('generates deterministic equivalent quantities for %s', unitPair => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const first = generator.generate({unitPair});
            expectConsistentProblem(first.data);
            setSeed(seed);
            expect(generator.generate({unitPair})).toEqual(first);
        }
    });

    it('reaches the complete starting-quantity range', () => {
        const starts = new Set<number>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const data = generator.generate({unitPair: 'pound-ounce'}).data;
            starts.add(data.equivalents[0]!.largerValue);
        }
        expect(starts).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
    });
});
