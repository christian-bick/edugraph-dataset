import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem
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

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);

const expectCoherent = (problem: MeasurementNumberLineProblem): void => {
    expect(Object.keys(problem).sort()).toEqual([
        'measurementKind',
        'numberKind',
        'targetIndex',
        'tickValues',
        'unitId'
    ]);
    expect(problem.unitId).toBe(unitIds[problem.measurementKind]);

    const tickCount = problem.tickValues.length - 1;
    const interval = problem.tickValues[1]!;
    expect(problem.targetIndex).toBeGreaterThan(1);
    expect(problem.targetIndex).toBeLessThan(tickCount);
    expect(problem.tickValues[problem.targetIndex]).toBeDefined();

    for (const [index, value] of problem.tickValues.entries()) {
        expect(value.numerator * tickCount).toBe(index * value.denominator);
        if (index > 0) {
            const previous = problem.tickValues[index - 1]!;
            const differenceNumerator = value.numerator * previous.denominator
                - previous.numerator * value.denominator;
            const differenceDenominator = value.denominator * previous.denominator;
            expect(differenceNumerator * interval.denominator)
                .toBe(interval.numerator * differenceDenominator);
        }
    }

    const start = problem.tickValues[0]!;
    const end = problem.tickValues[tickCount]!;
    expect(start.numerator).toBe(0);
    expect(end.numerator).toBe(end.denominator);

    const target = problem.tickValues[problem.targetIndex]!;
    if (problem.numberKind === 'fraction') {
        expect([4, 8]).toContain(tickCount);
        expect(target.numerator).toBeLessThan(target.denominator);
        expect(target.denominator).toBeGreaterThan(1);
        expect(gcd(target.numerator, target.denominator)).toBe(1);
        expect(start).toEqual({numerator: 0, denominator: 1});
        expect(end).toEqual({numerator: 1, denominator: 1});
        for (const value of problem.tickValues) {
            expect(gcd(value.numerator, value.denominator)).toBe(1);
        }
    } else {
        expect(tickCount).toBe(10);
        const denominator = problem.measurementKind === 'money' ? 100 : 10;
        expect(interval).toEqual({
            numerator: problem.measurementKind === 'money' ? 10 : 1,
            denominator
        });
        for (const value of problem.tickValues) {
            expect(value.denominator).toBe(denominator);
        }
    }
};

describe('MeasurementNumberLineGenerator', () => {
    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "measurementKind" is missing.');
        expect(() => generator.generate({
            measurementKind: 'distance',
            numberKind: 'fraction'
        } as never)).toThrow('Unsupported measurement kind "distance".');
        expect(() => generator.generate({
            measurementKind: 'length',
            numberKind: 'integer'
        } as never)).toThrow('Unsupported number kind "integer".');
    });

    it('is deterministic for the complete mathematical identity', () => {
        const config: MeasurementNumberLineGeneratorConfig = {
            measurementKind: 'liquid-volume',
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
            const data = generator.generate({
                measurementKind: 'length',
                numberKind: 'fraction'
            }).data;
            counts.add(data.tickValues.length - 1);
        }
        expect(counts).toEqual(new Set([4, 8]));
    });

    it('keeps ontology labels out of the generated payload', () => {
        for (const measurementKind of measurementKinds) {
            setSeed(measurementKind);
            const stub = generator.generate({
                measurementKind,
                numberKind: 'decimal'
            });
            expect(Object.keys(stub)).toEqual(['data']);
        }
    });

    it('keeps presentation fields out of the canonical payload', () => {
        setSeed('canonical-contract');
        const data = generator.generate({
            measurementKind: 'time',
            numberKind: 'fraction'
        }).data;
        for (const field of [
            'task',
            'unit',
            'tickCount',
            'ticks',
            'labeledTickIndices',
            'start',
            'end',
            'interval',
            'target',
            'prompt',
            'scaleStatement',
            'answerStatement',
            'explanation'
        ]) {
            expect(data).not.toHaveProperty(field);
        }
        expect(data.tickValues.every(value => Object.keys(value).length === 2)).toBe(true);
    });
});
