import {Area} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import * as randomSource from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
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
            operation: Area.Division, range: createCanonicalNumericRange(5)
        };
        setSeed('measurement-word-problem-determinism');
        const first = generator.generate(config);
        setSeed('measurement-word-problem-determinism');
        expect(generator.generate(config)).toEqual(first);
    });

    it.each([
        ['integer', undefined], ['integer', false], ['integer', null],
        ['integer', createCanonicalNumericRange(120)],
        ['integer', {min: 3, max: 20, maximumAbove: 10, minimumBelow: 5}],
        ['integer', {...createCanonicalNumericRange(20), maximumAbove: 0}],
        ['integer', {...createCanonicalNumericRange(20), minimumBelow: 10}],
        ['integer', createCanonicalNumericRange(100)],
        ['fraction', undefined], ['decimal', undefined],
        ['fraction', false], ['fraction', createCanonicalNumericRange(10)],
        ['fraction', {...createCanonicalNumericRange(5), maximumAbove: 5}],
        ['fraction', {...createCanonicalNumericRange(5), min: 1}],
        ['fraction', {...createCanonicalNumericRange(5), minimumBelow: 10}],
        ['decimal', createCanonicalNumericRange(5)]
    ])('rejects invalid or infeasible %s range %j without sampling', (numberKind, range) => {
        const random = vi.spyOn(randomSource, 'random');
        try {
            expect(() => generator.generate({measurementKind: 'length', numberKind, range,
                operation: Area.Addition, operandDigits: numberKind === 'integer'
                    ? {role: 'largest', digits: 1} : false} as never)).toThrow();
            expect(random).not.toHaveBeenCalled();
        } finally {
            random.mockRestore();
        }
    });

    it.each([
        ['unprofiled integer addition', 'integer', Area.Addition, undefined],
        ['fractional addition profile', 'fraction', Area.Addition, {role: 'largest', digits: 1}],
        ['decimal addition profile', 'decimal', Area.Addition, {role: 'largest', digits: 2}],
        ['unprofiled integer subtraction', 'integer', Area.Subtraction, undefined],
        ['empty integer subtraction profile', 'integer', Area.Subtraction, false],
        ['fractional subtraction profile', 'fraction', Area.Subtraction, {role: 'largest', digits: 1}],
        ['decimal subtraction profile', 'decimal', Area.Subtraction, {role: 'largest', digits: 2}],
        ['subtraction with smallest profile', 'integer', Area.Subtraction, {role: 'smallest', digits: 1}],
        ['subtraction with divisor profile', 'integer', Area.Subtraction, {role: 'divisor', digits: 1}],
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
            expect(() => generator.generate({measurementKind: 'length', numberKind, operation, operandDigits,
                range: numberKind === 'integer' ? createCanonicalNumericRange(20)
                    : numberKind === 'decimal' && operation === Area.Addition ? false : createCanonicalNumericRange(5)} as never)).toThrow();
            expect(random).not.toHaveBeenCalled();
        } finally {
            random.mockRestore();
        }
    });

    it.each(measurementKinds)('partitions every original integer tuple by tightest bounds and operand width for %s', measurementKind => {
        const random = vi.spyOn(randomSource, 'random');
        try {
            for (const operation of operations) {
                // Independent description of the support before canonical profiles were introduced.
                const expected: number[][] = [];
                if (operation === Area.Addition) {
                    for (let first = 2; first <= 20; first++) for (let second = 2; second <= 20; second++) {
                        expected.push([first, second, first + second]);
                    }
                } else if (operation === Area.Subtraction) {
                    for (let second = 2; second <= 10; second++) for (let answer = 1; answer <= 15; answer++) {
                        expected.push([second + answer, second, answer]);
                    }
                } else {
                    for (let groups = 2; groups <= 6; groups++) {
                        for (let measured = operation === Area.Division ? 1 : 2; measured <= 12; measured++) {
                            expected.push(operation === Area.Division
                                ? [groups * measured, groups, measured] : [groups, measured, groups * measured]);
                        }
                    }
                }
                const seen = new Set<string>();
                const digitChoices = operation === Area.Addition || operation === Area.Subtraction ? [1, 2] as const : [undefined];
                for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 100)) {
                    for (const digits of digitChoices) {
                        const tuples = expected.filter(values => {
                            const min = Math.min(...values), max = Math.max(...values);
                            const tightUpper = [5, 10, 20, 100].find(bound => max <= bound);
                            const tightLower = [0, 5, 10, 20].filter(bound => min >= bound).at(-1);
                            return range.max === tightUpper && range.min === tightLower
                                && (digits === undefined || String(Math.max(values[0], values[1])).length === digits);
                        });
                        if (!tuples.length) continue;
                        const profileSeen = new Set<string>();
                        for (let index = 0; index < tuples.length; index++) {
                            random.mockReturnValue((index + 0.5) / tuples.length);
                            const stub = generator.generate({measurementKind, numberKind: 'integer', operation, range,
                                operandDigits: digits === undefined ? undefined : {role: 'largest', digits}});
                            expectConsistent(stub.data, measurementKind, 'integer', operationNames[operation]);
                            const values = [...stub.data.operands.map(operand => operand.role === 'group-count'
                                ? operand.count : operand.value.numerator), stub.data.answer.numerator];
                            expect(Math.max(...values)).toBeLessThanOrEqual(range.max);
                            expect(Math.max(...values)).toBeGreaterThan(range.maximumAbove);
                            expect(Math.min(...values)).toBeGreaterThanOrEqual(range.min);
                            expect(Math.min(...values)).toBeLessThan(range.minimumBelow);
                            const key = values.join(',');
                            expect(seen.has(key)).toBe(false);
                            seen.add(key);
                            profileSeen.add(key);
                        }
                        expect(profileSeen).toEqual(new Set(tuples.map(values => values.join(','))));
                    }
                }
                expect(seen).toEqual(new Set(expected.map(values => values.join(','))));
            }
        } finally {
            random.mockRestore();
        }
    });

    it.each(measurementKinds)('preserves every fixed-bound noninteger tuple and one-draw sampling for %s', measurementKind => {
        // Independent finite support, expressed as the actual task quantities rather than storage numerators.
        const cases = [
            ['fraction', Area.Addition, [[1 / 8, 2 / 8, 3 / 8], [1 / 8, 6 / 8, 7 / 8], [3 / 8, 2 / 8, 5 / 8], [5 / 8, 2 / 8, 7 / 8]]],
            ['fraction', Area.Subtraction, [[3 / 8, 2 / 8, 1 / 8], [7 / 8, 6 / 8, 1 / 8], [5 / 8, 2 / 8, 3 / 8], [7 / 8, 2 / 8, 5 / 8]]],
            ['fraction', Area.Multiplication, [[2, 2 / 8, 4 / 8], [3, 2 / 8, 6 / 8], [3, 1 / 8, 3 / 8]]],
            ['fraction', Area.Division, [[2 / 8, 2, 1 / 8], [4 / 8, 2, 2 / 8], [3 / 8, 3, 1 / 8], [6 / 8, 3, 2 / 8]]],
            ['decimal', Area.Subtraction, [[2.7, 1.4, 1.3], [3.7, 1.6, 2.1], [4.7, 1.5, 3.2]]],
            ['decimal', Area.Multiplication, [[2, 1.3, 2.6], [3, 1.2, 3.6], [4, 1.1, 4.4]]],
            ['decimal', Area.Division, [[2.6, 2, 1.3], [3.6, 3, 1.2], [4.4, 4, 1.1]]]
        ] as const;
        const random = vi.spyOn(randomSource, 'random');
        const range = createCanonicalNumericRange(5);
        let count = 0;
        try {
            for (const [numberKind, operation, expected] of cases) {
                const seen: number[][] = [];
                for (const [index, tuple] of expected.entries()) {
                    random.mockClear().mockReturnValue((index + 0.5) / expected.length);
                    const {data} = generator.generate({measurementKind, numberKind, operation, range});
                    expectConsistent(data, measurementKind, numberKind, operationNames[operation]);
                    const values = [...data.operands.map(operand => operand.role === 'group-count'
                        ? operand.count : operand.value.numerator / operand.value.denominator),
                    data.answer.numerator / data.answer.denominator];
                    expect(values).toEqual(tuple);
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(random).toHaveBeenCalledTimes(1);
                    seen.push(values);
                    count++;
                }
                expect(seen).toEqual(expected);
            }
            expect(count).toBe(24);
        } finally {
            random.mockRestore();
        }
    });

    it('covers every measurement, number, and operation permutation with exact one-step math', () => {
        for (const measurementKind of measurementKinds) {
            for (const numberKind of numberKinds) {
                for (const operationLabel of operations) {
                    const profiles = numberKind === 'integer'
                        && (operationLabel === Area.Addition || operationLabel === Area.Subtraction)
                        ? ([1, 2] as const).map(digits => ({role: 'largest', digits} as const)) : [undefined];
                    for (const operandDigits of profiles) for (let seed = 0; seed < 40; seed++) {
                        setSeed(`${measurementKind}-${numberKind}-${operationLabel}-${seed}`);
                        const stub = generator.generate({
                            measurementKind,
                            numberKind,
                            operation: operationLabel,
                            operandDigits,
                            range: numberKind === 'integer'
                                ? createCanonicalNumericRange(operandDigits?.digits === 2 ? 20 : 5)
                                : numberKind === 'decimal' && operationLabel === Area.Addition ? false : createCanonicalNumericRange(5)
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
                operandDigits: {role: 'largest', digits: 1}, range: createCanonicalNumericRange(5)
            });
            expect(Object.keys(stub)).toEqual(['data']);
        }
    });
});
