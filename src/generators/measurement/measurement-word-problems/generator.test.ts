import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemNumberKind,
    MeasurementWordProblemValue
} from '../../../types/problems.ts';
import {ArithmeticOperationLabel} from '../../arithmetic/helpers.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {MeasurementWordProblemsGeneratorConfig} from './spec.ts';

const generator = new MeasurementWordProblemsGenerator();
const measurementKinds: readonly MeasurementWordProblemKind[] = [
    'length', 'time', 'liquid-volume', 'weight', 'money'
];
const numberKinds: readonly MeasurementWordProblemNumberKind[] = ['integer', 'fraction', 'decimal'];
const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;
const operationNames: Record<ArithmeticOperationLabel, MeasurementWordProblemGrade4['operation']> = {
    [Area.Addition]: 'addition',
    [Area.Subtraction]: 'subtraction',
    [Area.Multiplication]: 'multiplication',
    [Area.Division]: 'division'
};
const unitIds = {
    length: 'meter',
    time: 'hour',
    'liquid-volume': 'liter',
    weight: 'kilogram',
    money: 'dollar'
} as const;

const gcd = (left: number, right: number): number => right === 0 ? left : gcd(right, left % right);

const expectSameValue = (
    leftNumerator: number,
    leftDenominator: number,
    right: MeasurementWordProblemValue
): void => {
    expect(leftNumerator * right.denominator).toBe(right.numerator * leftDenominator);
};

const expectValueKind = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    measurementKind: MeasurementWordProblemKind
): void => {
    expect(value.numerator).toBeGreaterThan(0);
    expect(value.denominator).toBeGreaterThan(0);
    if (numberKind === 'integer') expect(value.denominator).toBe(1);
    else if (numberKind === 'fraction') {
        expect(value.denominator).toBeGreaterThan(1);
        expect(value.numerator).toBeLessThan(value.denominator);
        expect(gcd(value.numerator, value.denominator)).toBe(1);
    } else {
        expect(value.denominator).toBe(measurementKind === 'money' ? 100 : 10);
        expect(value.numerator % value.denominator).not.toBe(0);
    }
};

const expectConsistent = (
    problem: MeasurementWordProblemGrade4,
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind,
    operation: MeasurementWordProblemGrade4['operation']
): void => {
    expect(problem.measurementKind).toBe(measurementKind);
    expect(problem.numberKind).toBe(numberKind);
    expect(problem.operation).toBe(operation);
    expect(problem.unitId).toBe(unitIds[measurementKind]);
    expect(Object.keys(problem).sort()).toEqual([
        'answer', 'measurementKind', 'numberKind', 'operands', 'operation', 'unitId'
    ]);
    expectValueKind(problem.answer, numberKind, measurementKind);

    if (problem.operation === 'addition' || problem.operation === 'subtraction') {
        expect(problem.operands.map(({role}) => role)).toEqual(['measured', 'measured']);
        const [first, second] = problem.operands;
        expectValueKind(first.value, numberKind, measurementKind);
        expectValueKind(second.value, numberKind, measurementKind);
        const denominator = first.value.denominator * second.value.denominator;
        const numerator = problem.operation === 'addition'
            ? first.value.numerator * second.value.denominator
                + second.value.numerator * first.value.denominator
            : first.value.numerator * second.value.denominator
                - second.value.numerator * first.value.denominator;
        expect(numerator).toBeGreaterThan(0);
        expectSameValue(numerator, denominator, problem.answer);
    } else if (problem.operation === 'multiplication') {
        const [group, measured] = problem.operands;
        expect(problem.operands.map(({role}) => role)).toEqual(['group-count', 'measured']);
        expect(group.count).toBeGreaterThan(1);
        expectValueKind(measured.value, numberKind, measurementKind);
        expectSameValue(group.count * measured.value.numerator, measured.value.denominator, problem.answer);
    } else {
        const [total, group] = problem.operands;
        expect(problem.operands.map(({role}) => role)).toEqual(['measured', 'group-count']);
        if (total.role !== 'measured' || group.role !== 'group-count') {
            throw new Error('Expected a measured total followed by a group count.');
        }
        expect(group.count).toBeGreaterThan(1);
        expectValueKind(total.value, numberKind, measurementKind);
        expectSameValue(total.value.numerator, total.value.denominator * group.count, problem.answer);
    }
};

describe('MeasurementWordProblemsGenerator', () => {
    it('strictly validates every configuration field and supported value', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "measurementKind" is missing.');
        expect(() => generator.generate({
            measurementKind: 'distance', numberKind: 'integer', operation: Area.Addition
        } as never)).toThrow('Unsupported measurement kind "distance".');
        expect(() => generator.generate({
            measurementKind: 'length', numberKind: 'ratio', operation: Area.Addition
        } as never)).toThrow('Unsupported number kind "ratio".');
        expect(() => generator.generate({
            measurementKind: 'length', numberKind: 'integer', operation: 'unsupported'
        } as never)).toThrow('Unsupported operation "unsupported".');
    });

    it('is deterministic for the complete task identity', () => {
        const config: MeasurementWordProblemsGeneratorConfig = {
            measurementKind: 'liquid-volume',
            numberKind: 'decimal',
            operation: Area.Division
        };
        setSeed('measurement-word-problem-determinism');
        const first = generator.generate(config);
        setSeed('measurement-word-problem-determinism');
        expect(generator.generate(config)).toEqual(first);
    });

    it('covers every measurement, number, and operation permutation with exact one-step math', () => {
        for (const measurementKind of measurementKinds) {
            for (const numberKind of numberKinds) {
                for (const operationLabel of operations) {
                    for (let seed = 0; seed < 40; seed++) {
                        setSeed(`${measurementKind}-${numberKind}-${operationLabel}-${seed}`);
                        const stub = generator.generate({
                            measurementKind,
                            numberKind,
                            operation: operationLabel
                        });
                        expectConsistent(
                            stub.data,
                            measurementKind,
                            numberKind,
                            operationNames[operationLabel]
                        );
                    }
                }
            }
        }
    });

    it('propagates the fixed physical unit scale without adding a redundant money tag', () => {
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
                numberKind: 'integer',
                operation: Area.Addition
            });
            if (measurementKind === 'money') expect(stub.tags).toBeUndefined();
            else expect(stub.tags).toEqual([expectedTags[measurementKind]]);
        }
    });
});
