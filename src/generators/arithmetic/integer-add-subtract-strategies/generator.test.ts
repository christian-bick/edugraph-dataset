import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    IntegerAddSubtractStrategy,
    IntegerAddSubtractStrategyProblem
} from '../../../types/problems.ts';
import {IntegerAddSubtractStrategiesGenerator} from './generator.ts';

const targetRange = {min: 0, max: 1000};

const expectCommonInvariants = (problem: IntegerAddSubtractStrategyProblem): void => {
    expect(problem.task).toBe('integer-add-subtract-strategy');
    expect(problem.leftOperand).toBeGreaterThan(0);
    expect(problem.rightOperand).toBeGreaterThan(0);
    expect(problem.answer).toBeGreaterThan(0);
    expect(problem.leftOperand).toBeLessThan(1000);
    expect(problem.rightOperand).toBeLessThan(1000);
    expect(problem.answer).toBeLessThan(1000);
    expect(problem.adjustment).toBeGreaterThanOrEqual(1);
    expect(problem.adjustment).toBeLessThanOrEqual(9);
    expect(problem.steps).toHaveLength(3);
    expect(problem.steps.every(step => step.includes(' = '))).toBe(true);
    expect(problem.questionEquation).toContain('?');
    expect(problem.solutionEquation).toContain(`= ${problem.answer}`);
    expect(problem.prompt.length).toBeGreaterThan(0);
    expect(problem.explanation.length).toBeGreaterThan(0);
};

const expectExactStrategy = (problem: IntegerAddSubtractStrategyProblem): void => {
    const {leftOperand, rightOperand, answer, adjustment} = problem;

    if (problem.strategy === 'addition-compensation') {
        const adjustedLeft = leftOperand - adjustment;
        const friendlyRight = rightOperand + adjustment;
        expect(problem.operation).toBe('addition');
        expect(answer).toBe(leftOperand + rightOperand);
        expect(friendlyRight % 10).toBe(0);
        expect(problem.transformedEquation).toBe(
            `${leftOperand} + ${rightOperand} = ${adjustedLeft} + ${friendlyRight}`
        );
        expect(problem.steps).toEqual([
            `${leftOperand} − ${adjustment} = ${adjustedLeft}`,
            `${rightOperand} + ${adjustment} = ${friendlyRight}`,
            `${adjustedLeft} + ${friendlyRight} = ${answer}`
        ]);
        return;
    }

    if (problem.strategy === 'subtraction-compensation') {
        const adjustedLeft = leftOperand + adjustment;
        const friendlyRight = rightOperand + adjustment;
        expect(problem.operation).toBe('subtraction');
        expect(answer).toBe(leftOperand - rightOperand);
        expect(friendlyRight % 10).toBe(0);
        expect(problem.transformedEquation).toBe(
            `${leftOperand} − ${rightOperand} = ${adjustedLeft} − ${friendlyRight}`
        );
        expect(problem.steps).toEqual([
            `${rightOperand} + ${adjustment} = ${friendlyRight}`,
            `${leftOperand} + ${adjustment} = ${adjustedLeft}`,
            `${adjustedLeft} − ${friendlyRight} = ${answer}`
        ]);
        return;
    }

    const friendlyTen = rightOperand + adjustment;
    const remainingDifference = answer - adjustment;
    expect(problem.operation).toBe('subtraction');
    expect(answer).toBe(leftOperand - rightOperand);
    expect(friendlyTen % 10).toBe(0);
    expect(remainingDifference).toBeGreaterThan(0);
    expect(remainingDifference % 10).toBe(0);
    expect(leftOperand % 10).toBe(0);
    expect(problem.transformedEquation).toBe(`${rightOperand} + ? = ${leftOperand}`);
    expect(problem.steps).toEqual([
        `${rightOperand} + ${adjustment} = ${friendlyTen}`,
        `${friendlyTen} + ${remainingDifference} = ${leftOperand}`,
        `${adjustment} + ${remainingDifference} = ${answer}`
    ]);
};

describe('IntegerAddSubtractStrategiesGenerator', () => {
    const generator = new IntegerAddSubtractStrategiesGenerator();

    it('strictly validates every required configuration field', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({strategy: 'addition-compensation'} as never)).toThrow();
        expect(() => generator.generate({range: targetRange} as never)).toThrow();
    });

    it.each([
        'addition-compensation',
        'subtraction-compensation',
        'subtraction-think-addition'
    ] as const)('generates 100 exact and checkable %s problems', strategy => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({strategy, range: targetRange});
            expect(stub).not.toBeNull();
            expect(stub!.data.strategy).toBe(strategy);
            expectCommonInvariants(stub!.data);
            expectExactStrategy(stub!.data);
        }
    });

    it.each([
        'addition-compensation',
        'subtraction-compensation',
        'subtraction-think-addition'
    ] as const)('returns null when the numeric interval cannot support %s', strategy => {
        expect(generator.generate({strategy, range: {min: 9, max: 10}})).toBeNull();
    });

    it('rejects unsupported strategy configurations', () => {
        expect(() => generator.generate({
            strategy: 'addition-counting-on' as IntegerAddSubtractStrategy,
            range: targetRange
        })).toThrow();
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('integer-strategy');
        const first = generator.generate({strategy: 'subtraction-think-addition', range: targetRange});
        setSeed('integer-strategy');
        const second = generator.generate({strategy: 'subtraction-think-addition', range: targetRange});
        expect(second).toEqual(first);
    });
});
