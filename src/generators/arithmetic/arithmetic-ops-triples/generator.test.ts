import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {ArithmeticOpsTriplesGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

function expectValidEquation(problem: ArithmeticTripleProblem) {
    if (problem.operation === 'addition') expect(problem.num1 + problem.num2 + problem.num3).toBe(problem.answer);
    if (problem.operation === 'subtraction') expect(problem.num1 - problem.num2 - problem.num3).toBe(problem.answer);
    if (problem.operation === 'multiplication') expect(problem.num1 * problem.num2 * problem.num3).toBe(problem.answer);
    if (problem.operation === 'division') {
        expect(problem.num2).not.toBe(0);
        expect(problem.num3).not.toBe(0);
        expect(problem.num1 / problem.num2 / problem.num3).toBe(problem.answer);
    }
}

describe('ArithmeticOpsTriplesGenerator', () => {
    const generator = new ArithmeticOpsTriplesGenerator();

    it('strictly validates every required config field', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates non-negative triples for every operation and zero scope', () => {
        for (const operation of operations) {
            for (const requireZero of [false, true]) {
                for (let seed = 0; seed < 20; seed++) {
                    setSeed(seed);
                    const stub = generator.generate({
                        operation,
                        requireZero,
                        requireMultipleOf10: false,
                        useCommutativeLaw: false,
                        useAssociativeLaw: false,
                        range: {min: 1, max: 20}
                    });
                    expect(stub).not.toBeNull();
                    const values = [stub!.data.num1, stub!.data.num2, stub!.data.num3, stub!.data.answer];
                    expectValidEquation(stub!.data);
                    expect(values.every(value => value >= 0 && value <= 20)).toBe(true);
                    expect(values.includes(0)).toBe(requireZero);
                }
            }
        }
    });

    it('supports multiples of ten for every operation', () => {
        for (const operation of operations) {
            const stub = generator.generate({
                operation,
                requireZero: false,
                requireMultipleOf10: true,
                useCommutativeLaw: false,
                useAssociativeLaw: false,
                range: {min: 1, max: 1000000}
            });
            expect(stub).not.toBeNull();
            expectValidEquation(stub!.data);
            expect([stub!.data.num1, stub!.data.num2, stub!.data.num3, stub!.data.answer]
                .every(value => value % 10 === 0)).toBe(true);
        }
    });

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative']
    ] as const)('generates a valid %s %s-law triple', (operation, propertyLaw) => {
        const stub = generator.generate({
            operation,
            requireZero: false,
            requireMultipleOf10: false,
            useCommutativeLaw: propertyLaw === 'commutative',
            useAssociativeLaw: propertyLaw === 'associative',
            range: {min: 1, max: 20}
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expectValidEquation(stub!.data);
    });

    it('rejects incompatible triple configurations', () => {
        const baseConfig = {
            requireZero: false,
            requireMultipleOf10: false,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            range: {min: 1, max: 20}
        } as const;

        expect(generator.generate({...baseConfig, operation: Area.Division, useCommutativeLaw: true})).toBeNull();
        expect(generator.generate({
            ...baseConfig,
            operation: Area.Addition,
            useCommutativeLaw: true,
            useAssociativeLaw: true
        })).toBeNull();
        expect(generator.generate({...baseConfig, operation: 'unsupported'})).toBeNull();
    });
});
