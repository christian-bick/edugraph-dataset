import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

function apply(left: number, right: number, operation: ArithmeticOperation): number {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
}

const mathematicalValues = (data: ArithmeticEstimationProblem): number[] => [
    data.num1, data.num2, data.roundedNum1, data.roundedNum2, data.exactAnswer,
    data.estimatedAnswer, Math.round(data.estimatedAnswer / 10) * 10
];

describe('ArithmeticEstimationGenerator', () => {
    const generator = new ArithmeticEstimationGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: Area.Addition} as never)).toThrow();
    });

    it('generates coherent exact, rounded, and estimated values', () => {
        for (const operation of operations) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const stub = generator.generate({operation, range: {min: 0, max: 1000}});
                expect(stub).not.toBeNull();
                const data = stub!.data;
                expect(data.numberDomain).toEqual({min: 0, max: 1000});
                expect(data.exactAnswer).toBe(apply(data.num1, data.num2, data.operation));
                expect(data.roundedNum1).toBe(Math.round(data.num1 / 10) * 10);
                expect(data.roundedNum2).toBe(Math.round(data.num2 / 10) * 10);
                expect(data.estimatedAnswer).toBe(apply(
                    data.roundedNum1,
                    data.roundedNum2,
                    data.operation
                ));
                expect(data.roundingPlace).toBe(10);
                expect([
                    data.num1,
                    data.num2,
                    data.roundedNum1,
                    data.roundedNum2,
                    data.exactAnswer,
                    data.estimatedAnswer
                ].every(value => Number.isInteger(value) && value >= 0 && value <= 1000)).toBe(true);
            }
        }
    });

    it.each([Area.Addition, Area.Subtraction] as const)('supports %s within twenty without escaping its domain', operation => {
        const generated = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation, range: {min: 0, max: 20}});
            expect(stub).not.toBeNull();
            const data = stub!.data;
            generated.add(JSON.stringify(data));
            expect(data.numberDomain).toEqual({min: 0, max: 20});
            expect(mathematicalValues(data).every(value => Number.isInteger(value) && value >= 0 && value <= 20)).toBe(true);
            expect(data.exactAnswer).toBe(apply(data.num1, data.num2, data.operation));
            expect(data.estimatedAnswer).toBe(apply(data.roundedNum1, data.roundedNum2, data.operation));
            expect(data.roundedNum1 !== data.num1 || data.roundedNum2 !== data.num2).toBe(true);
        }
        expect(generated.size).toBeGreaterThan(4);
    });

    it.each(operations)('honors an explicit positive lower bound for %s', operation => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation, range: {min: 30, max: 1000}});
            expect(stub).not.toBeNull();
            expect(stub!.data.numberDomain).toEqual({min: 30, max: 1000});
            expect(mathematicalValues(stub!.data).every(value => value >= 30 && value <= 1000)).toBe(true);
        }
    });

    it('normalizes integer boundaries and retains the supported mathematical ceiling', () => {
        setSeed(0);
        expect(generator.generate({operation: Area.Addition, range: {min: 4.4, max: 20.9}})!.data.numberDomain)
            .toEqual({min: 5, max: 20});
        expect(generator.generate({operation: Area.Addition, range: {min: -5, max: 2000}})!.data.numberDomain)
            .toEqual({min: 0, max: 1000});
    });

    it.each([
        {min: 0, max: 9},
        {min: 11, max: 20},
        {min: Number.NaN, max: 1000},
        {min: 0, max: Number.NaN},
        {min: 1001, max: 2000},
        {min: 900, max: 1000}
    ])('rejects mathematically infeasible or invalid domain %j', range => {
        expect(generator.generate({operation: Area.Addition, range})).toBeNull();
    });

    it('returns null for unsupported operations and infeasible ranges', () => {
        expect(generator.generate({operation: 'unsupported', range: {min: 0, max: 1000}})).toBeNull();
        for (const operation of operations) {
            expect(generator.generate({operation, range: {min: 1000, max: 1000}})).toBeNull();
        }
    });
});
