import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {ArithmeticWordProblemsTwoStepGenerator} from './generator.ts';

const operationSequences = [
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction],
    [Area.Multiplication, Area.Multiplication],
    [Area.Division, Area.Division],
    [Area.Addition, Area.Subtraction],
    [Area.Multiplication, Area.Addition],
    [Area.Division, Area.Addition],
    [Area.Multiplication, Area.Subtraction],
    [Area.Division, Area.Subtraction],
    [Area.Multiplication, Area.Division]
] as const;

function expectValidSteps(problem: ArithmeticWordProblemTwoStep) {
    const apply = (left: number, right: number, operation: string) => {
        if (operation === 'addition') return left + right;
        if (operation === 'subtraction') return left - right;
        if (operation === 'multiplication') return left * right;
        return left / right;
    };
    const first = apply(problem.num1, problem.num2, problem.operations[0]);
    const second = apply(first, problem.num3, problem.operations[1]);

    expect(first).toBe(problem.intermediate);
    expect(second).toBe(problem.answer);
}

describe('ArithmeticWordProblemsTwoStepGenerator', () => {
    const generator = new ArithmeticWordProblemsTwoStepGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operations: [Area.Addition, Area.Addition]} as never)).toThrow();
    });

    it('generates connected, positive two-step problems within the requested range', () => {
        for (const operations of operationSequences) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const stub = generator.generate({operations, range: {min: 0, max: 100}});
                expect(stub).not.toBeNull();
                expectValidSteps(stub!.data);
                expect(stub!.data.kind).toBe('two-step');
                expect(stub!.data.blankPart).toBe('solution');
                expect([
                    stub!.data.num1,
                    stub!.data.num2,
                    stub!.data.num3,
                    stub!.data.intermediate,
                    stub!.data.answer
                ].every(value => Number.isInteger(value) && value > 0 && value <= 100)).toBe(true);
            }
        }
    });

    it('keeps every displayed value within the consuming view capacity', () => {
        for (const operations of operationSequences) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generator.generate({operations, range: {min: 0, max: 1_000_000}});
                expect(stub).not.toBeNull();
                expect(Math.max(
                    stub!.data.num1,
                    stub!.data.num2,
                    stub!.data.num3,
                    stub!.data.intermediate,
                    stub!.data.answer
                )).toBeLessThanOrEqual(100);
            }
        }
    });

    it('returns null for unsupported operations and infeasible ranges', () => {
        expect(generator.generate({operations: 'unsupported', range: {min: 0, max: 100}})).toBeNull();
        for (const operations of operationSequences) {
            expect(generator.generate({operations, range: {min: 5, max: 5}})).toBeNull();
        }
    });
});
