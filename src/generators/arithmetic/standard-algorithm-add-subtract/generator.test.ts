import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {StandardAlgorithmColumnStep, StandardAlgorithmProblem} from '../../../types/problems.ts';
import {StandardAlgorithmAddSubtractGenerator} from './generator.ts';

const targetRange = {min: 1000, max: 1000000};

const reconstructResult = (columns: readonly StandardAlgorithmColumnStep[]): number =>
    columns.reduce((value, column) => value + column.resultDigit * column.placeValue, 0);

function expectExactColumns(problem: StandardAlgorithmProblem): void {
    expect(problem.columns.length).toBeGreaterThanOrEqual(4);
    expect(problem.columns.length).toBeLessThanOrEqual(6);
    expect(problem.columns[0].placeValue).toBe(1);
    expect(problem.columns.at(-1)!.regroupOut).toBe(0);
    expect(reconstructResult(problem.columns)).toBe(problem.result);

    problem.columns.forEach((column, index) => {
        expect(column.topDigit).toBe(Math.floor(problem.topValue / column.placeValue) % 10);
        expect(column.bottomDigit).toBe(Math.floor(problem.bottomValue / column.placeValue) % 10);
        expect(column.regroupIn).toBe(index === 0 ? 0 : problem.columns[index - 1].regroupOut);
        expect(column.calculation.length).toBeGreaterThan(0);
        expect(column.regroupingRecord.length).toBeGreaterThan(0);

        if (problem.operation === 'addition') {
            expect(column.workingValue).toBe(
                column.topDigit + column.bottomDigit + column.regroupIn
            );
            expect(column.resultDigit).toBe(column.workingValue % 10);
            expect(column.regroupOut).toBe(column.workingValue >= 10 ? 1 : 0);
        } else {
            expect(column.workingValue).toBe(
                column.topDigit - column.regroupIn + 10 * column.regroupOut
            );
            expect(column.resultDigit).toBe(column.workingValue - column.bottomDigit);
            expect(column.regroupOut).toBe(
                column.topDigit - column.regroupIn < column.bottomDigit ? 1 : 0
            );
        }
    });
}

describe('StandardAlgorithmAddSubtractGenerator', () => {
    const generator = new StandardAlgorithmAddSubtractGenerator();

    it('strictly validates every required configuration field', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: 'addition'} as never)).toThrow();
        expect(() => generator.generate({range: targetRange} as never)).toThrow();
    });

    it.each(['addition', 'subtraction'] as const)(
        'generates exact %s columns with visible regrouping throughout the target range',
        operation => {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(seed);
                const stub = generator.generate({operation, range: targetRange});
                expect(stub).not.toBeNull();
                const problem = stub!.data;

                expect(problem.task).toBe('standard-algorithm');
                expect(problem.operation).toBe(operation);
                expect(problem.topValue).toBeGreaterThanOrEqual(1000);
                expect(problem.bottomValue).toBeGreaterThanOrEqual(1000);
                expect(problem.result).toBeGreaterThanOrEqual(1000);
                expect(problem.topValue).toBeLessThanOrEqual(999999);
                expect(problem.bottomValue).toBeLessThanOrEqual(999999);
                expect(problem.result).toBeLessThanOrEqual(999999);
                expect(problem.columns.some(column => column.regroupOut === 1)).toBe(true);
                expect(problem.questionEquation).toContain('?');
                expect(problem.solutionEquation).toContain(problem.result.toLocaleString('en-US'));
                expect(problem.explanation.length).toBeGreaterThan(0);

                if (operation === 'addition') {
                    expect(problem.topValue + problem.bottomValue).toBe(problem.result);
                    expect(String(problem.result).length).toBe(String(problem.topValue).length);
                } else {
                    expect(problem.topValue - problem.bottomValue).toBe(problem.result);
                }
                expectExactColumns(problem);
            }
        }
    );

    it('returns null when the range cannot hold two full-width positive operands and their result', () => {
        expect(generator.generate({operation: 'addition', range: {min: 1000, max: 2000}})).toBeNull();
        expect(generator.generate({operation: 'subtraction', range: {min: 10, max: 10}})).toBeNull();
    });

    it('rejects unsupported operation configurations', () => {
        expect(() => generator.generate({
            operation: 'division',
            range: targetRange
        } as never)).toThrow();
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('standard-algorithm');
        const first = generator.generate({operation: 'addition', range: targetRange});
        setSeed('standard-algorithm');
        const second = generator.generate({operation: 'addition', range: targetRange});
        expect(second).toEqual(first);
    });
});
