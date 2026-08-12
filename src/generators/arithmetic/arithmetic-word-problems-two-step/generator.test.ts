import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {ArithmeticWordProblemsTwoStepGenerator} from './generator.ts';

const operationSequences = [
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction],
    [Area.Addition, Area.Subtraction]
] as const;

function expectValidSteps(problem: ArithmeticWordProblemTwoStep) {
    const first = problem.operations[0] === 'addition'
        ? problem.num1 + problem.num2
        : problem.num1 - problem.num2;
    const second = problem.operations[1] === 'addition'
        ? first + problem.num3
        : first - problem.num3;

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

    it('returns null for unsupported operations and infeasible ranges', () => {
        expect(generator.generate({operations: 'unsupported', range: {min: 0, max: 100}})).toBeNull();
        expect(generator.generate({
            operations: [Area.Subtraction, Area.Addition],
            range: {min: 0, max: 100}
        })).toBeNull();
        for (const operations of operationSequences) {
            expect(generator.generate({operations, range: {min: 5, max: 10}})).toBeNull();
        }
    });
});
