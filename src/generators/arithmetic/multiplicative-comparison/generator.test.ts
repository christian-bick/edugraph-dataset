import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {MultiplicativeComparisonGenerator} from './generator.ts';

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
            const stub = generator.generate({operation: 'division'});
            expectValidComparison(stub.data);
            expect(stub.data.operation).toBe('division');
        }
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('multiplicative-comparison-seed');
        const first = generator.generate({operation: 'division'});
        setSeed('multiplicative-comparison-seed');
        const second = generator.generate({operation: 'division'});

        expect(second).toEqual(first);
    });
});
