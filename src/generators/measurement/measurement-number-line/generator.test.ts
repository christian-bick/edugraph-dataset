import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem,
    MeasurementNumberLineValue
} from '../../../types/problems.ts';
import {MeasurementNumberLineGenerator} from './generator.ts';
import {MeasurementNumberLineGeneratorConfig} from './spec.ts';

const generator = new MeasurementNumberLineGenerator();

const measurementKinds: readonly MeasurementNumberLineKind[] = [
    'length',
    'time',
    'liquid-volume',
    'weight',
    'money'
];

const numberKinds = ['fraction', 'decimal'] as const;

const unitIds = {
    length: 'meter',
    time: 'hour',
    'liquid-volume': 'liter',
    weight: 'kilogram',
    money: 'dollar'
} as const;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const expectSameValue = (
    first: MeasurementNumberLineValue,
    second: MeasurementNumberLineValue
): void => {
    expect(first.numerator * second.denominator).toBe(second.numerator * first.denominator);
};

const expectCoherent = (problem: MeasurementNumberLineProblem): void => {
    expect(problem.task).toBe('grade4-measurement-number-line');
    expect(problem.unit.id).toBe(unitIds[problem.measurementKind]);
    expect(problem.ticks).toHaveLength(problem.tickCount + 1);
    expect(problem.labeledTickIndices).toEqual([0, 1, problem.tickCount]);
    expect(problem.target.index).toBeGreaterThan(1);
    expect(problem.target.index).toBeLessThan(problem.tickCount);
    expect(problem.labeledTickIndices).not.toContain(problem.target.index);
    expect(problem.target).toEqual(problem.ticks[problem.target.index]);
    expect(problem.start).toEqual(problem.ticks[0]!.value);
    expect(problem.end).toEqual(problem.ticks[problem.tickCount]!.value);
    expect(problem.interval).toEqual(problem.ticks[1]!.value);

    for (const [index, tick] of problem.ticks.entries()) {
        expect(tick.index).toBe(index);
        expect(tick.value.numerator * problem.tickCount).toBe(index * tick.value.denominator);
        if (index > 0) {
            const previous = problem.ticks[index - 1]!.value;
            const differenceNumerator = tick.value.numerator * previous.denominator
                - previous.numerator * tick.value.denominator;
            const differenceDenominator = tick.value.denominator * previous.denominator;
            expect(differenceNumerator * problem.interval.denominator)
                .toBe(problem.interval.numerator * differenceDenominator);
        }
    }

    expect(problem.start.numerator).toBe(0);
    expect(problem.end.numerator).toBe(problem.end.denominator);
    expect(problem.prompt).toBe(`Plot ${problem.target.value.quantityText} on the number line.`);
    expect(problem.scaleStatement).toBe(`Each equal interval represents ${problem.interval.quantityText}.`);
    expect(problem.answerStatement).toBe(`${problem.target.value.quantityText} belongs at tick ${problem.target.index} after zero.`);
    expect(problem.explanation).toBe(`Starting at zero, count ${problem.target.index} equal intervals of ${problem.interval.quantityText}. The point lands at ${problem.target.value.quantityText}.`);
    expect(problem.prompt).not.toContain(`tick ${problem.target.index}`);
    expect(problem.scaleStatement).not.toContain(`tick ${problem.target.index}`);

    if (problem.numberKind === 'fraction') {
        expect([4, 8]).toContain(problem.tickCount);
        expect(problem.target.value.numerator).toBeLessThan(problem.target.value.denominator);
        expect(problem.target.value.denominator).toBeGreaterThan(1);
        expect(gcd(problem.target.value.numerator, problem.target.value.denominator)).toBe(1);
        expect(problem.target.value.display).toBe(`${problem.target.value.numerator}/${problem.target.value.denominator}`);
        expect(problem.target.value.display).not.toContain('.');
        if (problem.measurementKind === 'money') {
            expect(problem.target.value.quantityText).toBe(`${problem.target.value.display} of a dollar`);
        }
    } else {
        expect(problem.tickCount).toBe(10);
        const denominator = problem.measurementKind === 'money' ? 100 : 10;
        expect(problem.interval.denominator).toBe(denominator);
        expect(problem.interval.numerator).toBe(problem.measurementKind === 'money' ? 10 : 1);
        for (const {value} of problem.ticks) {
            expect(value.denominator).toBe(denominator);
            expect(value.display).toMatch(problem.measurementKind === 'money' ? /^\d+\.\d{2}$/ : /^\d+\.\d$/);
        }
    }

    expectSameValue(problem.target.value, problem.ticks[problem.target.index]!.value);
};

describe('MeasurementNumberLineGenerator', () => {
    it('strictly validates configuration and physical/currency semantics', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "measurementKind" is missing.');
        expect(() => generator.generate({
            measurementKind: 'distance',
            physicalMeasurement: true,
            numberKind: 'fraction'
        } as never)).toThrow('Unsupported measurement kind "distance".');
        expect(() => generator.generate({
            measurementKind: 'length',
            physicalMeasurement: true,
            numberKind: 'integer'
        } as never)).toThrow('Unsupported number kind "integer".');
        expect(() => generator.generate({
            measurementKind: 'money',
            physicalMeasurement: true,
            numberKind: 'decimal'
        })).toThrow('Physical measurement semantics are required');
    });

    it('is deterministic for the complete task identity', () => {
        const config: MeasurementNumberLineGeneratorConfig = {
            measurementKind: 'liquid-volume',
            physicalMeasurement: true,
            numberKind: 'fraction'
        };
        setSeed('measurement-number-line-determinism');
        const first = generator.generate(config);
        setSeed('measurement-number-line-determinism');
        expect(generator.generate(config)).toEqual(first);
    });

    it('generates all 10 target configurations with exact bounded scales', () => {
        for (const measurementKind of measurementKinds) {
            for (const numberKind of numberKinds) {
                for (let seed = 0; seed < 80; seed++) {
                    setSeed(`${measurementKind}-${numberKind}-${seed}`);
                    const stub = generator.generate({
                        measurementKind,
                        physicalMeasurement: measurementKind !== 'money',
                        numberKind
                    });
                    expectCoherent(stub.data);
                }
            }
        }
    });

    it('reaches both approved fraction interval counts', () => {
        const counts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            counts.add(generator.generate({
                measurementKind: 'length',
                physicalMeasurement: true,
                numberKind: 'fraction'
            }).data.tickCount);
        }
        expect(counts).toEqual(new Set([4, 8]));
    });

    it('propagates fixed physical unit scales and no redundant money tag', () => {
        const expectedTags = {
            length: Scope.MeterScale,
            time: Scope.HourIntervals,
            'liquid-volume': Scope.LiterScale,
            weight: Scope.KilogramScale
        } as const;
        for (const measurementKind of measurementKinds) {
            setSeed(measurementKind);
            const stub = generator.generate({
                measurementKind,
                physicalMeasurement: measurementKind !== 'money',
                numberKind: 'decimal'
            });
            if (measurementKind === 'money') expect(stub.tags).toBeUndefined();
            else expect(stub.tags).toEqual([expectedTags[measurementKind]]);
        }
    });

    it('authors grammatical proper-fraction and decimal endpoint quantities', () => {
        for (const measurementKind of measurementKinds.filter(kind => kind !== 'money')) {
            setSeed(`${measurementKind}-fraction-grammar`);
            const fraction = generator.generate({
                measurementKind,
                physicalMeasurement: true,
                numberKind: 'fraction'
            }).data;
            expect(fraction.target.value.quantityText)
                .toBe(`${fraction.target.value.display} of ${measurementKind === 'time' ? 'an' : 'a'} ${fraction.unit.singular}`);
            expect(fraction.prompt).toContain(fraction.target.value.quantityText);
            expect(fraction.scaleStatement).toContain(fraction.interval.quantityText);
            expect(fraction.answerStatement).toContain(fraction.target.value.quantityText);

            setSeed(`${measurementKind}-decimal-grammar`);
            const decimal = generator.generate({
                measurementKind,
                physicalMeasurement: true,
                numberKind: 'decimal'
            }).data;
            expect(decimal.end.quantityText).toBe(`1.0 ${decimal.unit.singular}`);
        }
    });
});
