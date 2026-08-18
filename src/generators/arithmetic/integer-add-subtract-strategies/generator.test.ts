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
    expect(problem.steps.length).toBeGreaterThanOrEqual(1);
    expect(problem.steps.length).toBeLessThanOrEqual(3);
    expect(problem.steps.every(step => step.includes(' = '))).toBe(true);
    expect(problem.questionEquation).toContain('?');
    expect(problem.solutionEquation).toContain(`= ${problem.answer}`);
    expect(problem.prompt.length).toBeGreaterThan(0);
    expect(problem.explanation.length).toBeGreaterThan(0);
};

const expectExactStrategy = (problem: IntegerAddSubtractStrategyProblem): void => {
    const {leftOperand, rightOperand, answer, adjustment} = problem;

    if (problem.strategy === 'addition-counting-on') {
        expect(problem.operation).toBe('addition');
        expect(rightOperand).toBeGreaterThanOrEqual(1);
        expect(rightOperand).toBeLessThanOrEqual(3);
        expect(adjustment).toBe(rightOperand);
        expect(answer).toBe(leftOperand + rightOperand);
        expect(problem.steps).toEqual(Array.from(
            {length: rightOperand},
            (_, index) => `${leftOperand + index} + 1 = ${leftOperand + index + 1}`
        ));
        return;
    }

    if (problem.strategy === 'subtraction-counting-back') {
        expect(problem.operation).toBe('subtraction');
        expect(rightOperand).toBeGreaterThanOrEqual(1);
        expect(rightOperand).toBeLessThanOrEqual(3);
        expect(adjustment).toBe(rightOperand);
        expect(answer).toBe(leftOperand - rightOperand);
        expect(problem.steps).toEqual(Array.from(
            {length: rightOperand},
            (_, index) => `${leftOperand - index} − 1 = ${leftOperand - index - 1}`
        ));
        return;
    }

    if (problem.strategy === 'addition-make-ten') {
        const remainder = rightOperand - adjustment;
        expect(problem.operation).toBe('addition');
        expect(leftOperand).toBeGreaterThanOrEqual(6);
        expect(leftOperand).toBeLessThan(10);
        expect(answer).toBe(leftOperand + rightOperand);
        expect(adjustment).toBe(10 - leftOperand);
        expect(remainder).toBeGreaterThan(0);
        expect(problem.steps).toEqual([
            `${rightOperand} = ${adjustment} + ${remainder}`,
            `${leftOperand} + ${adjustment} = 10`,
            `10 + ${remainder} = ${answer}`
        ]);
        return;
    }

    if (problem.strategy === 'addition-near-doubles') {
        const base = Math.min(leftOperand, rightOperand);
        const knownDouble = 2 * base;
        expect(problem.operation).toBe('addition');
        expect(Math.abs(leftOperand - rightOperand)).toBe(1);
        expect(adjustment).toBe(1);
        expect(answer).toBe(leftOperand + rightOperand);
        expect(problem.steps).toEqual([
            `${base} + ${base} = ${knownDouble}`,
            `${knownDouble} + 1 = ${answer}`
        ]);
        return;
    }

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

    if (problem.strategy === 'subtraction-make-ten') {
        const remainder = rightOperand - adjustment;
        expect(problem.operation).toBe('subtraction');
        expect(leftOperand).toBeGreaterThan(10);
        expect(leftOperand).toBeLessThan(20);
        expect(answer).toBe(leftOperand - rightOperand);
        expect(adjustment).toBe(leftOperand - 10);
        expect(remainder).toBeGreaterThan(0);
        expect(problem.transformedEquation).toBe(
            `${leftOperand} − ${rightOperand} = ${leftOperand} − (${adjustment} + ${remainder})`
        );
        expect(problem.steps).toEqual([
            `${rightOperand} = ${adjustment} + ${remainder}`,
            `${leftOperand} − ${adjustment} = 10`,
            `10 − ${remainder} = ${answer}`
        ]);
        return;
    }

    const friendlyTen = rightOperand + adjustment;
    const remainingDifference = answer - adjustment;
    expect(problem.operation).toBe('subtraction');
    expect(answer).toBe(leftOperand - rightOperand);
    expect(friendlyTen % 10).toBe(0);
    expect(remainingDifference).toBeGreaterThan(0);
    expect(friendlyTen).toBeGreaterThan(rightOperand);
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
        'addition-counting-on',
        'subtraction-counting-back',
        'addition-make-ten',
        'addition-near-doubles',
        'addition-compensation',
        'subtraction-compensation',
        'subtraction-make-ten',
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
        'addition-counting-on',
        'subtraction-counting-back',
        'addition-make-ten',
        'addition-near-doubles',
        'addition-compensation',
        'subtraction-compensation',
        'subtraction-make-ten',
        'subtraction-think-addition'
    ] as const)('returns null when the numeric interval cannot support %s', strategy => {
        expect(generator.generate({strategy, range: {min: 9, max: 10}})).toBeNull();
    });

    it.each([
        'addition-counting-on',
        'subtraction-counting-back',
        'addition-near-doubles'
    ] as const)('generates %s inside both Grade 1 ranges', strategy => {
        for (const range of [{min: 0, max: 10}, {min: 0, max: 20}]) {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(seed);
                const stub = generator.generate({strategy, range});
                expect(stub).not.toBeNull();
                expect(stub!.data.leftOperand).toBeLessThan(range.max);
                expect(stub!.data.rightOperand).toBeLessThan(range.max);
                expect(stub!.data.answer).toBeLessThan(range.max);
                expectExactStrategy(stub!.data);
            }
        }
    });

    it.each([
        'addition-make-ten',
        'subtraction-make-ten',
        'subtraction-think-addition'
    ] as const)('generates %s inside NumbersSmaller20', strategy => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({strategy, range: {min: 0, max: 20}});
            expect(stub).not.toBeNull();
            expect(stub!.data.leftOperand).toBeLessThan(20);
            expect(stub!.data.rightOperand).toBeLessThan(20);
            expect(stub!.data.answer).toBeLessThan(20);
            expectExactStrategy(stub!.data);
        }
    });

    it('retains multi-digit Grade 3 think-addition operands', () => {
        const generated = Array.from({length: 100}, (_, seed) => {
            setSeed(seed);
            return generator.generate({
                strategy: 'subtraction-think-addition',
                range: targetRange
            })!.data;
        });

        expect(generated.some(problem => problem.rightOperand >= 10)).toBe(true);
        generated.forEach(expectExactStrategy);
    });

    it('rejects unsupported strategy configurations', () => {
        expect(() => generator.generate({
            strategy: 'unsupported' as IntegerAddSubtractStrategy,
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
