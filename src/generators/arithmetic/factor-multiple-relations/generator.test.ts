import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FactorClassificationProblem,
    PositiveFactorEvidence
} from '../../../types/problems.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';

const expectedFactors = (number: number): number[] =>
    Array.from({length: number}, (_, index) => index + 1)
        .filter(candidate => number % candidate === 0);

const expectExhaustiveEvidence = (evidence: PositiveFactorEvidence): void => {
    expect(evidence.number).toBeGreaterThan(0);
    expect(evidence.number).toBeLessThan(100);
    expect(evidence.factors).toEqual(expectedFactors(evidence.number));
    expect(evidence.factorCount).toBe(evidence.factors.length);

    const expectedLowerFactors = evidence.factors.filter(
        factor => factor * factor <= evidence.number
    );
    expect(evidence.factorPairs.map(pair => pair.lowerFactor)).toEqual(expectedLowerFactors);
    expect(new Set(evidence.factorPairs.map(pair => pair.lowerFactor)).size)
        .toBe(evidence.factorPairs.length);
    for (const pair of evidence.factorPairs) {
        expect(pair.lowerFactor).toBeLessThanOrEqual(pair.upperFactor);
        expect(pair.lowerFactor * pair.upperFactor).toBe(evidence.number);
        expect(pair.equation).toBe(
            `${pair.lowerFactor} × ${pair.upperFactor} = ${evidence.number}`
        );
    }
};

const expectValidClassification = (problem: FactorClassificationProblem): void => {
    expectExhaustiveEvidence(problem);
    if (problem.kind === 'prime-classification') {
        expect(problem.classification).toBe('prime');
        expect(problem.factors).toEqual([1, problem.number]);
        expect(problem.factorCount).toBe(2);
    } else {
        expect(problem.classification).toBe('composite');
        expect(problem.factorCount).toBeGreaterThan(2);
    }
};

describe('FactorMultipleRelationsGenerator', () => {
    const generator = new FactorMultipleRelationsGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({task: 'unsupported'} as never))
            .toThrow('Unsupported task "unsupported".');
    });

    it('lists every positive factor pair exactly once', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({task: 'factor-pairs'}).data;
            expect(problem.kind).toBe('factor-pairs');
            if (problem.kind !== 'factor-pairs') throw new Error('Unexpected task');
            expectExhaustiveEvidence(problem);
        }
    });

    it('keeps the self-pair unique for 1 and perfect squares', () => {
        let oneProblem: PositiveFactorEvidence | undefined;
        let squareProblem: PositiveFactorEvidence | undefined;

        for (let seed = 0; seed < 1000 && (!oneProblem || !squareProblem); seed++) {
            setSeed(seed);
            const problem = generator.generate({task: 'factor-pairs'}).data;
            if (problem.kind !== 'factor-pairs') throw new Error('Unexpected task');
            if (problem.number === 1) oneProblem = problem;
            if (problem.number > 1 && Number.isInteger(Math.sqrt(problem.number))) {
                squareProblem = problem;
            }
        }

        expect(oneProblem).toBeDefined();
        expect(oneProblem!.factors).toEqual([1]);
        expect(oneProblem!.factorPairs).toEqual([
            {lowerFactor: 1, upperFactor: 1, equation: '1 × 1 = 1'}
        ]);

        expect(squareProblem).toBeDefined();
        expect(squareProblem!.factorPairs.filter(
            pair => pair.lowerFactor === pair.upperFactor
        )).toHaveLength(1);
        expectExhaustiveEvidence(squareProblem!);
    });

    it('provides affirmative one-digit perfect-divisibility evidence', () => {
        const divisors = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate({task: 'one-digit-multiple-test'}).data;
            expect(problem.kind).toBe('one-digit-multiple-test');
            if (problem.kind !== 'one-digit-multiple-test') throw new Error('Unexpected task');
            divisors.add(problem.divisor);
            expect(problem.divisor).toBeGreaterThanOrEqual(2);
            expect(problem.divisor).toBeLessThanOrEqual(9);
            expect(problem.quotient).toBeGreaterThan(0);
            expect(problem.candidate).toBe(problem.divisor * problem.quotient);
            expect(problem.candidate).toBeLessThan(100);
            expect(problem.remainder).toBe(0);
            expect(problem.isMultiple).toBe(true);
        }
        expect(divisors).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it.each([
        ['prime-classification', 'prime'],
        ['composite-classification', 'composite']
    ] as const)('justifies %s from exhaustive factors', (task, classification) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({task}).data;
            expect(problem.kind).toBe(task);
            if (problem.kind !== 'prime-classification' && problem.kind !== 'composite-classification') {
                throw new Error('Unexpected task');
            }
            expect(problem.classification).toBe(classification);
            expectValidClassification(problem);
        }
    });

    it('is deterministic for every task under the project RNG', () => {
        for (const task of [
            'factor-pairs',
            'one-digit-multiple-test',
            'prime-classification',
            'composite-classification'
        ] as const) {
            setSeed(`factor-multiple-relations-${task}`);
            const first = generator.generate({task});
            setSeed(`factor-multiple-relations-${task}`);
            const second = generator.generate({task});
            expect(second).toEqual(first);
        }
    });
});
