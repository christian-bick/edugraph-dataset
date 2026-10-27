import {Area} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import * as randomSource from '../../../lib/random.ts';
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

    it.each([
        ['unprofiled integer addition', 'integer', Area.Addition, undefined],
        ['fractional addition profile', 'fraction', Area.Addition, {role: 'largest', digits: 1}],
        ['decimal addition profile', 'decimal', Area.Addition, {role: 'largest', digits: 2}],
        ['subtraction profile', 'integer', Area.Subtraction, {role: 'largest', digits: 1}],
        ['integer multiplication with largest profile', 'integer', Area.Multiplication, {role: 'largest', digits: 1}],
        ['division with largest profile', 'integer', Area.Division, {role: 'largest', digits: 1}],
        ['addition with smallest profile', 'integer', Area.Addition, {role: 'smallest', digits: 1}],
        ['addition with divisor profile', 'integer', Area.Addition, {role: 'divisor', digits: 1}],
        ['missing profile width', 'integer', Area.Addition, {role: 'largest'}],
        ['zero profile width', 'integer', Area.Addition, {role: 'largest', digits: 0}],
        ['unsupported profile width', 'integer', Area.Addition, {role: 'largest', digits: 3}],
        ['noninteger profile width', 'integer', Area.Addition, {role: 'largest', digits: 1.5}],
        ['string profile width', 'integer', Area.Addition, {role: 'largest', digits: '1'}],
        ['null profile', 'integer', Area.Addition, null]
    ])('rejects %s before sampling', (_, numberKind, operation, operandDigits) => {
        const random = vi.spyOn(randomSource, 'random');
        try {
            expect(() => generator.generate({measurementKind: 'length', numberKind, operation, operandDigits} as never)).toThrow();
            expect(random).not.toHaveBeenCalled();
        } finally {
            random.mockRestore();
        }
    });

    it.each(measurementKinds)('partitions all original integer addition pairs by operand width for %s', measurementKind => {
        const seen = new Set<string>();
        const random = vi.spyOn(randomSource, 'random');
        try {
            for (const [largestOperandDigits, count] of [[1, 64], [2, 297]] as const) {
                const profilePairs = new Set<string>();
                for (let index = 0; index < count; index++) {
                    random.mockReturnValue((index + 0.5) / count);
                    const stub = generator.generate({measurementKind, numberKind: 'integer',
                        operation: Area.Addition, operandDigits: {role: 'largest', digits: largestOperandDigits}});
                    expectConsistent(stub.data, measurementKind, 'integer', 'addition');
                    if (stub.data.operation !== 'addition') throw new Error('Expected addition operands.');
                    const values = stub.data.operands.map(operand => operand.value.numerator);
                    expect(String(Math.max(...values)).length).toBe(largestOperandDigits);
                    const pair = values.join('+');
                    expect(seen.has(pair)).toBe(false);
                    seen.add(pair);
                    profilePairs.add(pair);
                }
                expect(profilePairs.size).toBe(count);
            }
            const expected = new Set<string>();
            for (let first = 2; first <= 20; first++) {
                for (let second = 2; second <= 20; second++) expected.add(`${first}+${second}`);
            }
            expect(seen).toEqual(expected);
            // The one-digit profile includes 9 + 9, although its answer has two digits.
            expect(seen.has('9+9')).toBe(true);
        } finally {
            random.mockRestore();
        }
    });

    it('covers every measurement, number, and operation permutation with exact one-step math', () => {
        for (const measurementKind of measurementKinds) {
            for (const numberKind of numberKinds) {
                for (const operationLabel of operations) {
                    const profiles = numberKind === 'integer' && operationLabel === Area.Addition
                        ? ([1, 2] as const).map(digits => ({role: 'largest', digits} as const)) : [undefined];
                    for (const operandDigits of profiles) for (let seed = 0; seed < 40; seed++) {
                        setSeed(`${measurementKind}-${numberKind}-${operationLabel}-${seed}`);
                        const stub = generator.generate({
                            measurementKind,
                            numberKind,
                            operation: operationLabel,
                            operandDigits
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

    it('keeps ontology labels out of the generated payload', () => {
        for (const measurementKind of measurementKinds) {
            setSeed(measurementKind);
            const stub = generator.generate({
                measurementKind,
                numberKind: 'integer',
                operation: Area.Addition,
                operandDigits: {role: 'largest', digits: 1}
            });
            expect(Object.keys(stub)).toEqual(['data']);
        }
    });
});
