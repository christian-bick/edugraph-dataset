import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
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

const formatMeasure = (
    value: number,
    unit: MeasurementConversionPair['largerUnit']
): string => `${formatStandardNumeral(value)} ${value === 1 ? unit.singular : unit.plural}`;

const expectValidPair = (pair: MeasurementConversionPair): void => {
    const expected = pairCases.find(([id]) => id === pair.id)!;
    expect([
        pair.id,
        pair.quantityKind,
        pair.scalingKind,
        pair.largerUnit.id,
        pair.smallerUnit.id,
        pair.factor
    ]).toEqual(expected);
    expect(pair.equivalenceEquation).toBe(
        `1 ${pair.largerUnit.singular} = ${formatStandardNumeral(pair.factor)} ${pair.smallerUnit.plural}`
    );
    expect(pair.factorStatement).toBe(
        `Multiply a number of ${pair.largerUnit.plural} by ${formatStandardNumeral(pair.factor)} to find the equivalent number of ${pair.smallerUnit.plural}.`
    );
    expect(pair.relativeSizeStatement).toMatch(new RegExp(`^One ${pair.largerUnit.singular} .+ one ${pair.smallerUnit.singular}\\.$`));
};

const expectConsistentProblem = (problem: MeasurementConversionProblem): void => {
    if (problem.task === 'generic-unit-scale') {
        const largeText = formatStandardNumeral(problem.largeUnitCount);
        const smallText = formatStandardNumeral(problem.smallUnitCount);
        const factorText = formatStandardNumeral(problem.unitsPerLarge);
        const solutionEquation = `${largeText} × ${factorText} = ${smallText}`;
        expect(problem.largeUnitCount).toBeGreaterThanOrEqual(3);
        expect(problem.largeUnitCount).toBeLessThanOrEqual(6);
        expect(problem.unitsPerLarge).toBeGreaterThanOrEqual(2);
        expect(problem.unitsPerLarge).toBeLessThanOrEqual(3);
        expect(problem.smallUnitCount).toBe(problem.largeUnitCount * problem.unitsPerLarge);
        expect(problem.prompt).toBe(
            'The same length is measured with large units and small units. Which unit size needs more units?'
        );
        expect(problem.equivalentLengthStatement).toBe(
            `The same length is ${largeText} large units or ${smallText} small units.`
        );
        expect(problem.questionEquation).toBe(`${largeText} × ${factorText} = ?`);
        expect(problem.solutionEquation).toBe(solutionEquation);
        expect(problem.answerStatement).toBe(
            `Smaller units need a larger count: ${smallText} > ${largeText}.`
        );
        expect(problem.explanation).toBe(
            `Each large unit covers the same length as ${factorText} small units, so ${solutionEquation}.`
        );
        return;
    }
    expectValidPair(problem.pair);
    const {pair} = problem;
    const factorText = formatStandardNumeral(pair.factor);

    if (problem.task === 'relative-unit-size') {
        const exampleEquation = `${formatMeasure(problem.exampleLargerValue, pair.largerUnit)} = ${formatMeasure(problem.exampleSmallerValue, pair.smallerUnit)}`;
        const quantity = pair.quantityKind === 'liquid-volume' ? 'liquid volume' : pair.quantityKind;
        expect(problem.exampleLargerValue).toBeGreaterThanOrEqual(2);
        expect(problem.exampleLargerValue).toBeLessThanOrEqual(9);
        expect(problem.exampleSmallerValue).toBe(problem.exampleLargerValue * pair.factor);
        expect(problem.exampleEquation).toBe(exampleEquation);
        expect(problem.answer).toBe(pair.factor);
        expect(problem.prompt).toBe(
            `Use the equivalent ${quantity} to determine how many ${pair.smallerUnit.plural} equal 1 ${pair.largerUnit.singular}.`
        );
        expect(problem.questionEquation).toBe(
            `1 ${pair.largerUnit.singular} = ? ${pair.smallerUnit.plural}`
        );
        expect(problem.solutionEquation).toBe(pair.equivalenceEquation);
        expect(problem.comparisonStatement).toBe(
            `${exampleEquation} names the same ${quantity} with a smaller count of ${pair.largerUnit.plural} and a larger count of ${pair.smallerUnit.plural}.`
        );
        expect(problem.explanation).toBe(
            `${exampleEquation} represents the same ${quantity}. Dividing both counts by ${formatStandardNumeral(problem.exampleLargerValue)} gives ${pair.equivalenceEquation}. ${pair.relativeSizeStatement}`
        );
        return;
    }

    if (problem.task === 'convert-larger-to-smaller') {
        const source = formatMeasure(problem.sourceValue, pair.largerUnit);
        const converted = formatMeasure(problem.convertedValue, pair.smallerUnit);
        const sourceText = formatStandardNumeral(problem.sourceValue);
        const convertedText = formatStandardNumeral(problem.convertedValue);
        const solutionEquation = `${sourceText} × ${factorText} = ${convertedText}`;
        const measurementEquation = `${source} = ${converted}`;
        expect(problem.sourceValue).toBeGreaterThanOrEqual(2);
        expect(problem.sourceValue).toBeLessThanOrEqual(9);
        expect(problem.convertedValue).toBe(problem.sourceValue * pair.factor);
        expect(problem.answer).toBe(problem.convertedValue);
        expect(problem.prompt).toBe(`Convert ${source} to ${pair.smallerUnit.plural}.`);
        expect(problem.questionEquation).toBe(`${sourceText} × ${factorText} = ?`);
        expect(problem.solutionEquation).toBe(solutionEquation);
        expect(problem.measurementEquation).toBe(measurementEquation);
        expect(problem.answerStatement).toBe(`${source} is equivalent to ${converted}.`);
        expect(problem.explanation).toBe(
            `Since ${pair.equivalenceEquation}, multiply ${sourceText} by ${factorText}. ${solutionEquation}, so ${measurementEquation}.`
        );
        return;
    }

    expect(problem.rows).toHaveLength(5);
    expect(problem.hiddenRowIndices).toEqual([3, 4]);
    expect(problem.columnHeaders).toEqual([
        `${pair.largerUnit.plural[0]!.toUpperCase()}${pair.largerUnit.plural.slice(1)} (${pair.largerUnit.symbol})`,
        `${pair.smallerUnit.plural[0]!.toUpperCase()}${pair.smallerUnit.plural.slice(1)} (${pair.smallerUnit.symbol})`
    ]);
    expect(problem.prompt).toBe(
        `Complete the two-column conversion table from ${pair.largerUnit.plural} to ${pair.smallerUnit.plural}.`
    );
    expect(problem.constantFactorStatement).toBe(pair.factorStatement);
    const startValue = problem.rows[0]!.largerValue;
    expect(startValue).toBeGreaterThanOrEqual(1);
    expect(startValue).toBeLessThanOrEqual(5);
    problem.rows.forEach((row, index) => {
        expect(row.largerValue).toBe(startValue + index);
        expect(row.smallerValue).toBe(row.largerValue * pair.factor);
        expect(row.measurementEquation).toBe(
            `${formatMeasure(row.largerValue, pair.largerUnit)} = ${formatMeasure(row.smallerValue, pair.smallerUnit)}`
        );
    });
    expect(problem.explanation).toBe(
        `Each ${pair.smallerUnit.singular} value equals its ${pair.largerUnit.singular} value multiplied by ${factorText}. For example, ${problem.rows.at(-1)!.measurementEquation}.`
    );
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

    it.each(pairCases)('generates all three truthful tasks for %s', pairId => {
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
            if (relative.task === 'relative-unit-size') relativeValues.add(relative.exampleLargerValue);
            if (conversion.task === 'convert-larger-to-smaller') conversionValues.add(conversion.sourceValue);
            if (table.task === 'conversion-table') tableStarts.add(table.rows[0]!.largerValue);
        }
        expect(relativeValues).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
        expect(conversionValues).toEqual(relativeValues);
        expect(tableStarts).toEqual(new Set([1, 2, 3, 4, 5]));
    });
});
