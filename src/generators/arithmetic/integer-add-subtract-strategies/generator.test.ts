import {IntegerAdditionCountingOnGenerator} from '../integer-addition-counting-on/generator.ts';
import {IntegerSubtractionCountingBackGenerator} from '../integer-subtraction-counting-back/generator.ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {flexibleStrategyRows} from './domain.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {
    IntegerAddSubtractStrategyProblem,
    IntegerAddSubtractStrategyStep
} from '../../../types/problems.ts';
import {IntegerAddSubtractStrategiesGenerator} from './generator.ts';

const operation = (
    operationType: 'addition' | 'subtraction',
    leftOperand: number,
    rightOperand: number,
    result: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'operation',
    operation: operationType,
    leftOperand,
    rightOperand,
    result
});

const decomposition = (
    whole: number,
    firstPart: number,
    secondPart: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'decomposition',
    whole,
    parts: [firstPart, secondPart]
});

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
    expect(problem.steps.every(step => typeof step === 'object' && step !== null)).toBe(true);
    expect(Object.keys(problem).sort()).toEqual([
        'adjustment',
        'answer',
        'leftOperand',
        'operation',
        'rightOperand',
        'steps',
        'strategy',
        'task'
    ]);
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
            (_, index) => operation(
                'addition', leftOperand + index, 1, leftOperand + index + 1
            )
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
            (_, index) => operation(
                'subtraction', leftOperand - index, 1, leftOperand - index - 1
            )
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
            decomposition(rightOperand, adjustment, remainder),
            operation('addition', leftOperand, adjustment, 10),
            operation('addition', 10, remainder, answer)
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
            operation('addition', base, base, knownDouble),
            operation('addition', knownDouble, 1, answer)
        ]);
        return;
    }

    if (problem.strategy === 'addition-compensation') {
        const adjustedLeft = leftOperand - adjustment;
        const friendlyRight = rightOperand + adjustment;
        expect(problem.operation).toBe('addition');
        expect(answer).toBe(leftOperand + rightOperand);
        expect(friendlyRight % 10).toBe(0);
        expect(problem.steps).toEqual([
            operation('subtraction', leftOperand, adjustment, adjustedLeft),
            operation('addition', rightOperand, adjustment, friendlyRight),
            operation('addition', adjustedLeft, friendlyRight, answer)
        ]);
        return;
    }

    if (problem.strategy === 'subtraction-compensation') {
        const adjustedLeft = leftOperand + adjustment;
        const friendlyRight = rightOperand + adjustment;
        expect(problem.operation).toBe('subtraction');
        expect(answer).toBe(leftOperand - rightOperand);
        expect(friendlyRight % 10).toBe(0);
        expect(problem.steps).toEqual([
            operation('addition', rightOperand, adjustment, friendlyRight),
            operation('addition', leftOperand, adjustment, adjustedLeft),
            operation('subtraction', adjustedLeft, friendlyRight, answer)
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
        expect(problem.steps).toEqual([
            decomposition(rightOperand, adjustment, remainder),
            operation('subtraction', leftOperand, adjustment, 10),
            operation('subtraction', 10, remainder, answer)
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
    expect(problem.steps).toEqual([
        operation('addition', rightOperand, adjustment, friendlyTen),
        operation('addition', friendlyTen, remainingDifference, leftOperand),
        operation('addition', adjustment, remainingDifference, answer)
    ]);
};

afterEach(() => vi.restoreAllMocks());
const strategies = ['addition-make-ten', 'addition-near-doubles', 'addition-compensation-single', 'addition-compensation-multiple',
    'subtraction-compensation-single', 'subtraction-compensation-multiple', 'subtraction-make-ten', 'subtraction-think-addition'] as const;
const quantities = (data: IntegerAddSubtractStrategyProblem): number[] => [data.leftOperand, data.rightOperand, data.answer, data.adjustment,
    ...data.steps.flatMap(step => step.kind === 'decomposition' ? [step.whole, ...step.parts] : [step.leftOperand, step.rightOperand, step.result])];

describe('IntegerAddSubtractStrategiesGenerator canonical construction', () => {
    const generator = new IntegerAddSubtractStrategiesGenerator();

    it.each(strategies)('constructs exact %s proofs across every feasible canonical profile', strategy => {
        const random = vi.spyOn(rng, 'random');
        for (const {range} of canonicalRangeProfiles.filter(profile => profile.range.max <= 1000 && [0, 5].includes(profile.range.min))) {
            const rows = flexibleStrategyRows(strategy, range);
            if (!rows.length) continue;
            const total = rows.reduce((sum, row) => sum + row.weight, 0);
            for (const row of rows) {
                const cumulative = rows.slice(0, rows.indexOf(row)).reduce((sum, current) => sum + current.weight, 0);
                for (const tail of [row.minimum, row.maximum]) {
                    random.mockReset().mockReturnValueOnce((cumulative + row.weight / 2) / total)
                        .mockReturnValueOnce((tail - row.minimum + 0.5) / (row.maximum - row.minimum + 1));
                    const {data} = generator.generate({strategy, range});
                    expect(random).toHaveBeenCalledTimes(2);
                    expectCommonInvariants(data);
                    expectExactStrategy(data);
                    expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                    if (strategy.endsWith('-single')) expect(Math.max(data.leftOperand, data.rightOperand)).toBeLessThan(10);
                    if (strategy.endsWith('-multiple')) expect(Math.max(data.leftOperand, data.rightOperand)).toBeGreaterThanOrEqual(10);
                }
            }
        }
    });

    it('preserves all old low-width frames, teen subtraction and inclusive20 support', () => {
        for (const strategy of ['addition-compensation-single', 'subtraction-compensation-single'] as const) {
            expect(flexibleStrategyRows(strategy, createCanonicalNumericRange(20)).reduce((sum, row) => sum + row.maximum - row.minimum + 1, 0)).toBe(36);
        }
        expect(flexibleStrategyRows('subtraction-make-ten', createCanonicalNumericRange(20, 5)).reduce((sum, row) => sum + row.maximum - row.minimum + 1, 0)).toBe(5);
        const random = vi.spyOn(rng, 'random').mockReturnValue(0.999999);
        expect(generator.generate({strategy: 'addition-make-ten', range: createCanonicalNumericRange(20)}).data.answer).toBe(20);
        expect(generator.generate({strategy: 'subtraction-think-addition', range: createCanonicalNumericRange(20, 5)}).data.leftOperand).toBe(20);
        expect(random).toHaveBeenCalledTimes(4);
    });

    it('rejects malformed or infeasible profiles before consuming randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, {strategy: 'addition-near-doubles'},
            {strategy: 'unsupported', range: createCanonicalNumericRange(20)},
            {strategy: 'addition-make-ten', range: {min: 0, max: 20}},
            {strategy: 'addition-make-ten', range: createCanonicalNumericRange(10000)},
            {strategy: 'addition-near-doubles', range: createCanonicalNumericRange(100, 10)},
            {strategy: 'addition-near-doubles', range: createCanonicalNumericRange(20, 5)},
            {strategy: 'addition-compensation-single', range: createCanonicalNumericRange(1000)}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('replays with fresh typed-step objects and unchanged random continuation', () => {
        const config = {strategy: 'subtraction-think-addition' as const, range: createCanonicalNumericRange(1000, 5)};
        rng.setSeed('integer-strategy');
        const first = generator.generate(config), expected = structuredClone(first), continuation = rng.getRandomState();
        (first.data.steps as unknown as {result?: number}[])[0]!.result = 999;
        rng.setSeed('integer-strategy');
        expect(generator.generate(config)).toEqual(expected);
        expect(rng.getRandomState()).toBe(continuation);
    });

    it('leaves both separately owned counting leaves on their existing canonical domains', () => {
        for (const generator of [new IntegerAdditionCountingOnGenerator(), new IntegerSubtractionCountingBackGenerator()]) {
            const data = generator.generate({range: createCanonicalNumericRange(20)}).data;
            expectExactStrategy(data);
        }
    });
});
