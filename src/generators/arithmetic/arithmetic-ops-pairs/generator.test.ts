import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticPairProblem} from '../../../types/problems.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

function expectValidEquation(problem: ArithmeticPairProblem) {
    if (problem.operation === 'addition') expect(problem.num1 + problem.num2).toBe(problem.answer);
    if (problem.operation === 'subtraction') expect(problem.num1 - problem.num2).toBe(problem.answer);
    if (problem.operation === 'multiplication') expect(problem.num1 * problem.num2).toBeCloseTo(problem.answer);
    if (problem.operation === 'division') {
        expect(problem.num2).not.toBe(0);
        expect(problem.num1 / problem.num2).toBeCloseTo(problem.answer);
    }
}

describe('ArithmeticOpsPairsGenerator', () => {
    const generator = new ArithmeticOpsPairsGenerator();

    it('has the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('strictly validates every required config field', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({
            operation: Area.Addition,
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            invertProcedure: false
        } as never)).toThrow();
        expect(() => generator.generate({
            operation: Area.Addition,
            range: {min: 1, max: 10},
            requireZero: false,
            requireMultipleOf10: false,
            invertProcedure: false
        } as never)).toThrow();
    });

    it('proves zero and negative scope requirements for every operation and seed', () => {
        for (const operation of operations) {
            for (const requireZero of [false, true]) {
                for (const requireNegative of [false, true]) {
                    for (let seed = 0; seed < 25; seed++) {
                        setSeed(seed);
                        const stub = generator.generate({
                            operation,
                            requireNegative,
                            requireZero,
                            requireMultipleOf10: false,
                            invertProcedure: false,
                            requireEqualAddends: false,
                            requireEvenResult: false,
                            range: {min: 1, max: 10}
                        });
                        expect(stub).not.toBeNull();
                        const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                        expectValidEquation(stub!.data);
                        expect(values.every(value => Math.abs(value) <= 10)).toBe(true);
                        expect(values.includes(0)).toBe(requireZero);
                        expect(values.some(value => value < 0)).toBe(requireNegative);
                    }
                }
            }
        }
    });

    it('constrains every numeric term to a multiple of 10', () => {
        for (const operation of operations) {
            for (const requireZero of [false, true]) {
                for (let seed = 0; seed < 20; seed++) {
                    setSeed(seed);
                    const stub = generator.generate({
                        operation,
                        requireNegative: false,
                        requireZero,
                        requireMultipleOf10: true,
                        invertProcedure: false,
                        requireEqualAddends: false,
                        requireEvenResult: false,
                        range: {min: 1, max: 1000}
                    });
                    expect(stub).not.toBeNull();
                    const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                    expectValidEquation(stub!.data);
                    expect(values.every(value => value % 10 === 0)).toBe(true);
                    expect(values.includes(0)).toBe(requireZero);
                }
            }
        }
    });

    it('scopes procedure inversion to the second operand', () => {
        const baseConfig = {
            operation: Area.Addition,
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            requireEqualAddends: false,
            requireEvenResult: false,
            range: {min: 1, max: 10}
        } as const;

        expect(generator.generate({...baseConfig, invertProcedure: true})!.data.blankPart).toBe('num2');
        expect(generator.generate({...baseConfig, invertProcedure: false})!.data.blankPart).toBe('solution');
    });

    it('returns null for an unsupported operation or impossible range', () => {
        const baseConfig = {
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            invertProcedure: false,
            requireEqualAddends: false,
            requireEvenResult: false,
            range: {min: 1, max: 10}
        } as const;

        expect(generator.generate({...baseConfig, operation: 'unsupported'})).toBeNull();
        expect(generator.generate({...baseConfig, operation: Area.Addition, range: {min: 10, max: 1}})).toBeNull();
    });

    it('generates an even result from two equal addends when requested', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                operation: Area.Addition,
                requireNegative: false,
                requireZero: false,
                requireMultipleOf10: false,
                invertProcedure: false,
                requireEqualAddends: true,
                requireEvenResult: true,
                range: {min: 1, max: 20}
            });
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBe(stub!.data.num2);
            expect(stub!.data.answer % 2).toBe(0);
            expect(stub!.data.answer).toBeLessThanOrEqual(20);
        }
    });
});
