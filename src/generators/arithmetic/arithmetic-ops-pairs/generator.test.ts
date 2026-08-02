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
            requireMultipleOf10: false,
            useThreeAddends: false,
            useCommutativeLaw: false,
            useAssociativeLaw: false
        } as any)).toThrow();
        expect(() => generator.generate({
            operation: Area.Addition,
            range: {min: 1, max: 10},
            requireZero: false,
            requireMultipleOf10: false,
            useThreeAddends: false,
            useCommutativeLaw: false,
            useAssociativeLaw: false
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
                            requireMultipleOf10: false,
                            useThreeAddends: false,
                            useCommutativeLaw: false,
                            useAssociativeLaw: false,
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

    it('should constrain every numeric term to a multiple of 10', () => {
        for (const operation of operations) {
            for (const requireZero of [false, true]) {
                for (let seed = 0; seed < 20; seed++) {
                    setSeed(seed);
                    const stub = generator.generate({
                        operation,
                        requireNegative: false,
                        requireZero,
                        requireMultipleOf10: true,
                        useThreeAddends: false,
                        useCommutativeLaw: false,
                        useAssociativeLaw: false,
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

    it('should generate exactly three addends whose sum respects every numeric constraint', () => {
        for (const requireNegative of [false, true]) {
            for (const requireZero of [false, true]) {
                for (const requireMultipleOf10 of [false, true]) {
                    for (let seed = 0; seed < 20; seed++) {
                        setSeed(seed);
                        const stub = generator.generate({
                            operation: Area.Addition,
                            requireNegative,
                            requireZero,
                            requireMultipleOf10,
                            useThreeAddends: true,
                            useCommutativeLaw: false,
                            useAssociativeLaw: false,
                            range: {min: 1, max: requireMultipleOf10 ? 100 : 20}
                        });
                        expect(stub).not.toBeNull();
                        const {num1, num2, num3, answer} = stub!.data;
                        expect(num3).toBeTypeOf('number');
                        const values = [num1, num2, num3!, answer];
                        expect(num1 + num2 + num3!).toBe(answer);
                        expect(values.every(value => Math.abs(value) <= (requireMultipleOf10 ? 100 : 20))).toBe(true);
                        expect(values.includes(0)).toBe(requireZero);
                        expect(values.some(value => value < 0)).toBe(requireNegative);
                        if (requireMultipleOf10) {
                            expect(values.every(value => value % 10 === 0)).toBe(true);
                        }
                    }
                }
            }
        }
    });

    it.each([Area.Subtraction, Area.Multiplication, Area.Division] as const)(
        'should reject three-addend configuration for %s',
        operation => {
            expect(generator.generate({
                operation,
                requireNegative: false,
                requireZero: false,
                requireMultipleOf10: false,
                useThreeAddends: true,
                useCommutativeLaw: false,
                useAssociativeLaw: false,
                range: {min: 1, max: 20}
            })).toBeNull();
        }
    );

    it('should return null for unsupported operations and impossible ranges', () => {
        const baseConfig = {
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            useThreeAddends: false,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            range: {min: 1, max: 20}
        } as const;

        expect(generator.generate({...baseConfig, operation: 'unsupported'} as any)).toBeNull();
        expect(generator.generate({
            ...baseConfig,
            operation: Area.Addition,
            range: {min: 20, max: 1}
        })).toBeNull();
        expect(generator.generate({
            ...baseConfig,
            operation: Area.Addition,
            useThreeAddends: true,
            range: {min: 5, max: 10}
        })).toBeNull();
    });

    it.each([
        ['commutative', true, false, false],
        ['associative', false, true, true]
    ] as const)('should generate a valid %s law payload', (propertyLaw, useCommutativeLaw, useAssociativeLaw, expectsThird) => {
        const stub = generator.generate({
            operation: Area.Addition,
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            useThreeAddends: false,
            useCommutativeLaw,
            useAssociativeLaw,
            range: {min: 1, max: 20}
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expect(stub!.data.num3 !== undefined).toBe(expectsThird);
        const expected = stub!.data.num1 + stub!.data.num2 + (stub!.data.num3 ?? 0);
        expect(stub!.data.answer).toBe(expected);
    });

    it('should reject incompatible arithmetic-law configurations', () => {
        const baseConfig = {
            requireNegative: false,
            requireZero: false,
            requireMultipleOf10: false,
            useThreeAddends: false,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            range: {min: 1, max: 20}
        } as const;

        expect(generator.generate({
            ...baseConfig,
            operation: Area.Addition,
            useCommutativeLaw: true,
            useAssociativeLaw: true
        })).toBeNull();
        expect(generator.generate({
            ...baseConfig,
            operation: Area.Subtraction,
            useCommutativeLaw: true
        })).toBeNull();
        expect(generator.generate({
            ...baseConfig,
            operation: Area.Addition,
            useThreeAddends: true,
            useCommutativeLaw: true
        })).toBeNull();
    });
});
