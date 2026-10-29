import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {MultiplicativeComparisonGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

function expectValidComparison(problem: MultiplicativeComparisonProblem): void {
    expect(problem.referenceQuantity).toBeGreaterThan(0);
    expect(problem.scaleFactor).toBeGreaterThan(1);
    expect(Number.isInteger(problem.referenceQuantity)).toBe(true);
    expect(Number.isInteger(problem.scaleFactor)).toBe(true);
    expect(problem.comparedQuantity).toBe(problem.referenceQuantity * problem.scaleFactor);
    expect(problem.comparedQuantity).toBeLessThanOrEqual(100);
}

describe('MultiplicativeComparisonGenerator', () => {
    const generator = new MultiplicativeComparisonGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates positive integral multiplication comparisons', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation: 'multiplication'});
            expectValidComparison(stub.data);
            expect(stub.data.operation).toBe('multiplication');
        }
    });

    it('generates division comparisons without presentation decisions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const operation = seed % 2 ? 'division-single' : 'division-two';
            const stub = generator.generate({operation});
            expectValidComparison(stub.data);
            expect(stub.data.operation).toBe('division');
            expect(stub.data.comparedQuantity < 10).toBe(operation === 'division-single');
        }
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('multiplicative-comparison-seed');
        const first = generator.generate({operation: 'division-two'});
        setSeed('multiplicative-comparison-seed');
        const second = generator.generate({operation: 'division-two'});

        expect(second).toEqual(first);
    });

    it('preserves every old factor pair across the two division widths', () => {
        const random = vi.spyOn(rng, 'random');
        const oldPairs = new Set<string>();
        for (let scale = 2; scale <= 9; scale++) {
            for (let reference = 2; reference <= Math.min(12, Math.floor(100 / scale)); reference++) {
                oldPairs.add(`${scale}:${reference}`);
            }
        }
        const covered = new Set<string>();
        for (const operation of ['division-single', 'division-two'] as const) {
            const rows = Array.from({length: 8}, (_, index) => index + 2).map(scale => ({scale,
                references: Array.from({length: 11}, (_, index) => index + 2)
                    .filter(reference => reference * scale <= 100
                        && (reference * scale < 10) === (operation === 'division-single'))
            })).filter(row => row.references.length > 0);
            const weights = rows.map(row => row.references.length / (Math.min(12, Math.floor(100 / row.scale)) - 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let cumulativeWeight = 0;
            for (const [rowIndex, row] of rows.entries()) {
                for (const [index, reference] of row.references.entries()) {
                    random.mockReset().mockReturnValueOnce((cumulativeWeight + weights[rowIndex]! / 2) / totalWeight)
                        .mockReturnValueOnce((index + 0.5) / row.references.length);
                    const {data} = generator.generate({operation});
                    expect(data).toEqual({scaleFactor: row.scale, referenceQuantity: reference,
                        comparedQuantity: row.scale * reference, operation: 'division'});
                    const key = `${row.scale}:${reference}`;
                    expect(covered.has(key)).toBe(false);
                    covered.add(key);
                }
                cumulativeWeight += weights[rowIndex]!;
            }
        }
        expect(covered).toEqual(oldPairs);
    });
});
