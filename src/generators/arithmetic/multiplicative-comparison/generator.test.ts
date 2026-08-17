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
    expect(problem.story).not.toContain('?');
    expect(problem.question).toContain('?');
    expect(problem.givenEquation).toContain('?');
    expect(problem.solutionEquation).not.toContain('?');
    expect(problem.comparisonStatement).toBe(
        `${problem.comparedEntity} has ${problem.scaleFactor} times as many stickers as ${problem.referenceEntity}.`
    );

    if (problem.unknownRole === 'compared') {
        expect(problem.operation).toBe('multiplication');
        expect(problem.answer).toBe(problem.comparedQuantity);
        expect(problem.givenEquation).toBe(
            `${problem.referenceQuantity} × ${problem.scaleFactor} = ?`
        );
        expect(problem.solutionEquation).toBe(
            `${problem.referenceQuantity} × ${problem.scaleFactor} = ${problem.comparedQuantity}`
        );
    } else if (problem.unknownRole === 'reference') {
        expect(problem.operation).toBe('division');
        expect(problem.answer).toBe(problem.referenceQuantity);
        expect(problem.givenEquation).toBe(
            `${problem.comparedQuantity} ÷ ${problem.scaleFactor} = ?`
        );
        expect(problem.solutionEquation).toBe(
            `${problem.comparedQuantity} ÷ ${problem.scaleFactor} = ${problem.referenceQuantity}`
        );
    } else {
        expect(problem.operation).toBe('division');
        expect(problem.answer).toBe(problem.scaleFactor);
        expect(problem.givenEquation).toBe(
            `${problem.comparedQuantity} ÷ ${problem.referenceQuantity} = ?`
        );
        expect(problem.solutionEquation).toBe(
            `${problem.comparedQuantity} ÷ ${problem.referenceQuantity} = ${problem.scaleFactor}`
        );
    }
}

describe('MultiplicativeComparisonGenerator', () => {
    const generator = new MultiplicativeComparisonGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates positive integral multiplication comparisons with the compared quantity unknown', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation: 'multiplication'});
            expectValidComparison(stub.data);
            expect(stub.data.unknownRole).toBe('compared');
        }
    });

    it('generates both division unknown roles without losing the comparison invariant', () => {
        const roles = new Set<string>();

        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation: 'division'});
            expectValidComparison(stub.data);
            roles.add(stub.data.unknownRole);
        }

        expect(roles).toEqual(new Set(['reference', 'scale-factor']));
    });

    it('is deterministic for a project RNG seed', () => {
        setSeed('multiplicative-comparison-seed');
        const first = generator.generate({operation: 'division'});
        setSeed('multiplicative-comparison-seed');
        const second = generator.generate({operation: 'division'});

        expect(second).toEqual(first);
    });
});
