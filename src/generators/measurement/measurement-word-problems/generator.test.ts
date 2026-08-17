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
    'length',
    'time',
    'liquid-volume',
    'weight',
    'money'
];

const numberKinds: readonly MeasurementWordProblemNumberKind[] = [
    'integer',
    'fraction',
    'decimal'
];

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

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

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
    expect(value.quantityText).toContain(value.display);
    expect(value.equationTerm).toContain(value.display);
    if (numberKind === 'integer') {
        expect(value.denominator).toBe(1);
        expect(value.display).toMatch(/^\d+$/);
    } else if (numberKind === 'fraction') {
        expect(value.denominator).toBeGreaterThan(1);
        expect(value.numerator).toBeLessThan(value.denominator);
        expect(gcd(value.numerator, value.denominator)).toBe(1);
        expect(value.display).toBe(`${value.numerator}/${value.denominator}`);
        expect(value.display).not.toContain('.');
        if (measurementKind === 'money') {
            expect(value.quantityText).toBe(`${value.display} of a dollar`);
            expect(value.equationTerm).toBe(`${value.display} dollar`);
        }
    } else {
        expect(value.denominator).toBe(measurementKind === 'money' ? 100 : 10);
        expect(value.display).toMatch(measurementKind === 'money' ? /^\d+\.\d{2}$/ : /^\d+\.\d$/);
        expect(value.numerator % value.denominator).not.toBe(0);
    }
};

const expectConsistent = (
    problem: MeasurementWordProblemGrade4,
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind,
    operation: MeasurementWordProblemGrade4['operation']
): void => {
    expect(problem.task).toBe('grade4-measurement-word-problem');
    expect(problem.measurementKind).toBe(measurementKind);
    expect(problem.numberKind).toBe(numberKind);
    expect(problem.operation).toBe(operation);
    expect(problem.unit.id).toBe(unitIds[measurementKind]);
    expect(problem.story.length).toBeGreaterThan(20);
    expect(problem.question).toMatch(/\?$/);
    expect(problem.questionEquation).toContain('?');
    expect(problem.solutionEquation).not.toContain('?');
    expect(problem.answerStatement).toBe(`The answer is ${problem.answer.quantityText}.`);
    expect(problem.explanation).toContain(problem.solutionEquation);
    expectValueKind(problem.answer, numberKind, measurementKind);

    if (problem.operation === 'addition' || problem.operation === 'subtraction') {
        expect(problem.operands.map(({role}) => role)).toEqual(['measured', 'measured']);
        const [first, second] = problem.operands;
        expectValueKind(first.value, numberKind, measurementKind);
        expectValueKind(second.value, numberKind, measurementKind);
        expect(problem.story).toContain(first.value.quantityText);
        expect(problem.story).toContain(second.value.quantityText);
        const commonDenominator = first.value.denominator * second.value.denominator;
        const numerator = problem.operation === 'addition'
            ? first.value.numerator * second.value.denominator + second.value.numerator * first.value.denominator
            : first.value.numerator * second.value.denominator - second.value.numerator * first.value.denominator;
        expect(numerator).toBeGreaterThan(0);
        expectSameValue(numerator, commonDenominator, problem.answer);
    } else if (problem.operation === 'multiplication') {
        expect(problem.operands.map(({role}) => role)).toEqual(['group-count', 'measured']);
        const [group, measured] = problem.operands;
        expect(Number.isInteger(group.count)).toBe(true);
        expect(group.count).toBeGreaterThan(1);
        expect(group.display).toBe(`${group.count} equal groups`);
        expectValueKind(measured.value, numberKind, measurementKind);
        expect(problem.story).toContain(String(group.count));
        expect(problem.story).toContain(measured.value.quantityText);
        expectSameValue(group.count * measured.value.numerator, measured.value.denominator, problem.answer);
    } else {
        expect(problem.operands.map(({role}) => role)).toEqual(['measured', 'group-count']);
        const [total, group] = problem.operands;
        if (total.role !== 'measured' || group.role !== 'group-count') {
            throw new Error('Expected measured total followed by group count.');
        }
        expect(Number.isInteger(group.count)).toBe(true);
        expect(group.count).toBeGreaterThan(1);
        expectValueKind(total.value, numberKind, measurementKind);
        expect(problem.story).toContain(total.value.quantityText);
        expect(problem.story).toContain(String(group.count));
        expectSameValue(total.value.numerator, total.value.denominator * group.count, problem.answer);
    }

    const [left, right] = problem.operands;
    const leftTerm = left.role === 'measured' ? left.value.equationTerm : String(left.count);
    const rightTerm = right.role === 'measured' ? right.value.equationTerm : String(right.count);
    const symbol = {addition: '+', subtraction: '−', multiplication: '×', division: '÷'}[operation];
    const unknown = measurementKind === 'money' ? '?' : `? ${problem.unit.symbol}`;
    expect(problem.questionEquation).toBe(`${leftTerm} ${symbol} ${rightTerm} = ${unknown}`);
    expect(problem.solutionEquation).toBe(`${leftTerm} ${symbol} ${rightTerm} = ${problem.answer.equationTerm}`);
};

describe('MeasurementWordProblemsGenerator', () => {
    it('strictly validates every configuration field and supported value', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "measurementKind" is missing.');
        expect(() => generator.generate({
            measurementKind: 'distance',
            physicalMeasurement: true,
            numberKind: 'integer',
            operation: Area.Addition
        } as never)).toThrow('Unsupported measurement kind "distance".');
        expect(() => generator.generate({
            measurementKind: 'length',
            physicalMeasurement: true,
            numberKind: 'ratio',
            operation: Area.Addition
        } as never)).toThrow('Unsupported number kind "ratio".');
        expect(() => generator.generate({
            measurementKind: 'length',
            physicalMeasurement: true,
            numberKind: 'integer',
            operation: 'unsupported'
        } as never)).toThrow('Unsupported operation "unsupported".');
        expect(() => generator.generate({
            measurementKind: 'money',
            physicalMeasurement: true,
            numberKind: 'integer',
            operation: Area.Addition
        })).toThrow('Physical measurement semantics are required');
    });

    it('is deterministic for the complete task identity', () => {
        const config: MeasurementWordProblemsGeneratorConfig = {
            measurementKind: 'liquid-volume' as const,
            physicalMeasurement: true,
            numberKind: 'decimal' as const,
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
                            physicalMeasurement: measurementKind !== 'money',
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
                physicalMeasurement: measurementKind !== 'money',
                numberKind: 'integer',
                operation: Area.Addition
            });
            if (measurementKind === 'money') expect(stub.tags).toBeUndefined();
            else expect(stub.tags).toEqual([expectedTags[measurementKind]]);
        }
    });
});
