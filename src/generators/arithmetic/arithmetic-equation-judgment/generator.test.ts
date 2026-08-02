import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';

describe('ArithmeticEquationJudgmentGenerator', () => {
    const generator = new ArithmeticEquationJudgmentGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({operation: Area.Addition, requireZero: false} as any)).toThrow();
    });

    it('rejects unsupported operations and impossible ranges', () => {
        expect(generator.generate({
            operation: Area.Multiplication as any,
            requireZero: false,
            range: {min: 1, max: 20}
        })).toBeNull();
        expect(generator.generate({
            operation: Area.Addition,
            requireZero: false,
            range: {min: 5, max: 2}
        })).toBeNull();
        expect(generator.generate({
            operation: Area.Addition,
            requireZero: false,
            range: {min: 10, max: 10}
        })).toBeNull();
    });

    it('generates mathematically consistent true and false judgments', () => {
        const truthValues = new Set<boolean>();
        for (const operation of [Area.Addition, Area.Subtraction] as const) {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    operation,
                    requireZero: false,
                    range: {min: 0, max: 20}
                });
                expect(stub).not.toBeNull();
                const data = stub!.data;
                const actual = data.operation === 'addition'
                    ? data.num1 + data.num2
                    : data.num1 - data.num2;
                expect(data.claimedAnswer === actual).toBe(data.isTrue);
                expect([data.num1, data.num2, data.claimedAnswer].every(value => value > 0 && value <= 20)).toBe(true);
                truthValues.add(data.isTrue);
            }
        }
        expect(truthValues).toEqual(new Set([true, false]));
    });

    it('includes a zero witness when requested', () => {
        for (const operation of [Area.Addition, Area.Subtraction] as const) {
            const stub = generator.generate({
                operation,
                requireZero: true,
                range: {min: 0, max: 20}
            });
            expect(stub).not.toBeNull();
            expect([stub!.data.num1, stub!.data.num2,
                operation === Area.Addition ? stub!.data.num1 + stub!.data.num2 : stub!.data.num1 - stub!.data.num2]
                .includes(0)).toBe(true);
        }
    });
});
