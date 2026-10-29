import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {additionCompensation, subtractionCompensation} from './integer-strategy-evidence.ts';

afterEach(() => vi.restoreAllMocks());

describe('compensation operand-width partitions', () => {
    it.each(['addition', 'subtraction'] as const)(
        'preserves every old %s operand pair across the disjoint profiles', operation => {
            const build = operation === 'addition' ? additionCompensation : subtractionCompensation;
            const random = vi.spyOn(rng, 'random');
            for (const maximum of [19, 99, 999]) {
                const oldRows = Array.from({length: maximum}, (_, index) => index + 1)
                    .filter(right => right % 10 !== 0 && right + 10 - right % 10 <= maximum)
                    .map(right => {
                        const adjustment = 10 - right % 10;
                        return {right, minimum: operation === 'addition' ? adjustment + 1 : right + 1,
                            maximum: operation === 'addition' ? maximum - right : maximum - adjustment};
                    }).filter(row => row.minimum <= row.maximum);
                const rowsFor = (width: 'single' | 'multiple') => oldRows.map(row => ({...row,
                    minimum: width === 'multiple' && row.right < 10 ? Math.max(10, row.minimum) : row.minimum,
                    maximum: width === 'single' ? row.right < 10 ? Math.min(9, row.maximum) : -1 : row.maximum
                })).filter(row => row.minimum <= row.maximum);
                const count = (rows: typeof oldRows) => rows.reduce((sum, row) => sum + row.maximum - row.minimum + 1, 0);
                expect(count(rowsFor('single')) + count(rowsFor('multiple'))).toBe(count(oldRows));
                for (const largestOperandWidth of ['single', 'multiple'] as const) {
                    const rows = rowsFor(largestOperandWidth);
                    const weights = rows.map(row => {
                        const original = oldRows.find(old => old.right === row.right)!;
                        return (row.maximum - row.minimum + 1) / (original.maximum - original.minimum + 1);
                    });
                    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                    let cumulativeWeight = 0;
                    for (const [index, row] of rows.entries()) {
                        for (const edge of [0, 1 - Number.EPSILON]) {
                            random.mockReset().mockReturnValueOnce((cumulativeWeight + weights[index]! / 2) / totalWeight)
                                .mockReturnValueOnce(edge);
                            const problem = build({minimum: 1, maximum, largestOperandWidth})!;
                            expect(problem.rightOperand).toBe(row.right);
                            expect(problem.leftOperand).toBe(edge === 0 ? row.minimum : row.maximum);
                            expect(Math.max(problem.leftOperand, problem.rightOperand) < 10)
                                .toBe(largestOperandWidth === 'single');
                            expect(problem.answer).toBe(operation === 'addition'
                                ? problem.leftOperand + problem.rightOperand : problem.leftOperand - problem.rightOperand);
                            expect(problem.steps).toHaveLength(3);
                        }
                        cumulativeWeight += weights[index]!;
                    }
                }
            }
        }
    );

    it('retains the old unprofiled sampler and rejects empty profiles', () => {
        const random = vi.spyOn(rng, 'random').mockReturnValue(0);
        for (const build of [additionCompensation, subtractionCompensation]) {
            const old = build({minimum: 1, maximum: 99})!;
            expect(old.rightOperand).toBe(1);
            expect(build({minimum: 10, maximum: 99, largestOperandWidth: 'single'})).toBeNull();
            expect(build({minimum: 1, maximum: 9, largestOperandWidth: 'multiple'})).toBeNull();
        }
        expect(random).toHaveBeenCalled();
    });
});
