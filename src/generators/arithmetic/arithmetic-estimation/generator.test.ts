import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticOperation} from '../../../types/problems.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

function apply(left: number, right: number, operation: ArithmeticOperation): number {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
}

describe('ArithmeticEstimationGenerator', () => {
    const generator = new ArithmeticEstimationGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: Area.Addition} as never)).toThrow();
    });

    it('generates coherent exact, rounded, estimated, and proposed values', () => {
        const verdicts = new Set<boolean>();
        for (const operation of operations) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const stub = generator.generate({operation, range: {min: 0, max: 1000}});
                expect(stub).not.toBeNull();
                const data = stub!.data;
                expect(data.exactAnswer).toBe(apply(data.num1, data.num2, data.operation));
                expect(data.roundedNum1).toBe(Math.round(data.num1 / 10) * 10);
                expect(data.roundedNum2).toBe(Math.round(data.num2 / 10) * 10);
                expect(data.estimatedAnswer).toBe(apply(
                    data.roundedNum1,
                    data.roundedNum2,
                    data.operation
                ));
                expect(data.estimateDifference).toBe(Math.abs(
                    data.proposedAnswer - data.estimatedAnswer
                ));
                expect(data.isReasonable).toBe(data.estimateDifference <= data.tolerance);
                expect([
                    data.num1,
                    data.num2,
                    data.roundedNum1,
                    data.roundedNum2,
                    data.exactAnswer,
                    data.estimatedAnswer,
                    data.proposedAnswer
                ].every(value => Number.isInteger(value) && value >= 0 && value <= 1000)).toBe(true);
                verdicts.add(data.isReasonable);
            }
        }
        expect(verdicts).toEqual(new Set([true, false]));
    });

    it('returns null for unsupported operations and infeasible ranges', () => {
        expect(generator.generate({operation: 'unsupported', range: {min: 0, max: 1000}})).toBeNull();
        for (const operation of operations) {
            expect(generator.generate({operation, range: {min: 1000, max: 1000}})).toBeNull();
        }
    });
});
