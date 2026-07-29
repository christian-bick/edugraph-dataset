import {describe, expect, it} from 'vitest';
import {Area} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticProblem} from '../../../types/problems.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

function expectValidEquation(problem: ArithmeticProblem) {
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

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({
            operation: Area.Addition,
            requireNegative: false,
            requireZero: false,
            invertProcedure: false
        } as any)).toThrow();
        expect(() => generator.generate({
            operation: Area.Addition,
            range: {min: 1, max: 10},
            requireZero: false,
            invertProcedure: false
        } as any)).toThrow();
    });

    it('should prove zero and negative scope requirements for every operation and seed', () => {
        for (const operation of operations) {
            for (const requireZero of [false, true]) {
                for (const requireNegative of [false, true]) {
                    for (let seed = 0; seed < 25; seed++) {
                        setSeed(seed);
                        const stub = generator.generate({
                            operation,
                            requireNegative,
                            requireZero,
                            invertProcedure: false,
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

    it('should expose the second operand for procedure inversion', () => {
        const baseConfig = {
            operation: Area.Addition,
            requireNegative: false,
            requireZero: false,
            range: {min: 1, max: 10}
        } as const;

        expect(generator.generate({...baseConfig, invertProcedure: true})!.data.blankPart).toBe('num2');
        expect(generator.generate({...baseConfig, invertProcedure: false})!.data.blankPart).toBe('solution');
    });
});
