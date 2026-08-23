import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionProblem
} from '../../../types/problems.ts';
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

const tasks = [
    'relative-unit-size',
    'convert-larger-to-smaller',
    'conversion-table'
] as const;

const expectValidPair = (pair: MeasurementConversionPair): void => {
    const expected = pairCases.find(([id]) => id === pair.id)!;
    expect([
        pair.id,
        pair.quantityKind,
        pair.scalingKind,
        pair.largerUnit,
        pair.smallerUnit,
        pair.factor
    ]).toEqual(expected);
};

const expectConsistentProblem = (problem: MeasurementConversionProblem): void => {
    if (problem.task === 'generic-unit-scale') {
        expect(problem.largeUnitCount).toBeGreaterThanOrEqual(3);
        expect(problem.largeUnitCount).toBeLessThanOrEqual(6);
        expect(problem.unitsPerLarge).toBeGreaterThanOrEqual(2);
        expect(problem.unitsPerLarge).toBeLessThanOrEqual(3);
        expect(problem.smallUnitCount).toBe(problem.largeUnitCount * problem.unitsPerLarge);
        expect(Object.keys(problem).sort()).toEqual([
            'largeUnitCount',
            'smallUnitCount',
            'task',
            'unitsPerLarge'
        ]);
        return;
    }

    expectValidPair(problem.pair);
    if (problem.task === 'relative-unit-size') {
        expect(problem.exampleLargerValue).toBeGreaterThanOrEqual(2);
        expect(problem.exampleLargerValue).toBeLessThanOrEqual(9);
        expect(problem.exampleSmallerValue).toBe(
            problem.exampleLargerValue * problem.pair.factor
        );
        return;
    }

    if (problem.task === 'convert-larger-to-smaller') {
        expect(problem.sourceValue).toBeGreaterThanOrEqual(2);
        expect(problem.sourceValue).toBeLessThanOrEqual(9);
        expect(problem.convertedValue).toBe(problem.sourceValue * problem.pair.factor);
        return;
    }

    expect(problem.rows).toHaveLength(5);
    const startValue = problem.rows[0]!.largerValue;
    expect(startValue).toBeGreaterThanOrEqual(1);
    expect(startValue).toBeLessThanOrEqual(5);
    problem.rows.forEach((row, index) => {
        expect(row).toEqual({
            largerValue: startValue + index,
            smallerValue: (startValue + index) * problem.pair.factor
        });
    });
};

describe('MeasurementConversionGenerator', () => {
    const generator = new MeasurementConversionGenerator();

    it('strictly validates task and unit-pair configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({
            task: 'relative-unit-size',
            unitPair: 'yard-foot'
        } as never)).toThrow('Unsupported unit pair "yard-foot".');
        expect(() => generator.generate({
            task: 'unknown',
            unitPair: 'kilometer-meter'
        } as never)).toThrow('Unsupported task "unknown".');
        expect(() => generator.generate({
            task: 'conversion-table',
            unitPair: 'generic-unit-scale'
        })).toThrow('Generic unit scaling does not support task "conversion-table".');
    });

    it('generates a genuine bounded generic unit-scale relation', () => {
        const largeCounts = new Set<number>();
        const factors = new Set<number>();
        for (let seed = 0; seed < 500; seed++) {
            setSeed(`generic-${seed}`);
            const problem = generator.generate({
                task: 'relative-unit-size',
                unitPair: 'generic-unit-scale'
            }).data;
            expect(problem.task).toBe('generic-unit-scale');
            expectConsistentProblem(problem);
            if (problem.task === 'generic-unit-scale') {
                largeCounts.add(problem.largeUnitCount);
                factors.add(problem.unitsPerLarge);
            }
        }
        expect(largeCounts).toEqual(new Set([3, 4, 5, 6]));
        expect(factors).toEqual(new Set([2, 3]));
    });

    it.each(tasks)('is deterministic for %s', task => {
        setSeed(`deterministic-${task}`);
        const first = generator.generate({task, unitPair: 'kilometer-meter'});
        setSeed(`deterministic-${task}`);
        expect(generator.generate({task, unitPair: 'kilometer-meter'})).toEqual(first);
    });

    it.each(pairCases)('generates all three canonical tasks for %s', pairId => {
        for (const task of tasks) {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(`${pairId}-${task}-${seed}`);
                const problem = generator.generate({
                    task,
                    unitPair: pairId as MeasurementConversionPairId
                }).data;
                expect(problem.task).toBe(task);
                expectConsistentProblem(problem);
            }
        }
    });

    it('reaches both random-value boundaries for bounded tasks', () => {
        const relativeValues = new Set<number>();
        const conversionValues = new Set<number>();
        const tableStarts = new Set<number>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const relative = generator.generate({
                task: 'relative-unit-size',
                unitPair: 'pound-ounce'
            }).data;
            setSeed(seed);
            const conversion = generator.generate({
                task: 'convert-larger-to-smaller',
                unitPair: 'pound-ounce'
            }).data;
            setSeed(seed);
            const table = generator.generate({
                task: 'conversion-table',
                unitPair: 'pound-ounce'
            }).data;
            if (relative.task === 'relative-unit-size') {
                relativeValues.add(relative.exampleLargerValue);
            }
            if (conversion.task === 'convert-larger-to-smaller') {
                conversionValues.add(conversion.sourceValue);
            }
            if (table.task === 'conversion-table') tableStarts.add(table.rows[0]!.largerValue);
        }
        expect(relativeValues).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
        expect(conversionValues).toEqual(relativeValues);
        expect(tableStarts).toEqual(new Set([1, 2, 3, 4, 5]));
    });
});
