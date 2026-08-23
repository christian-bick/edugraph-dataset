import {describe, expect, it} from 'vitest';
import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {resolveEstimationClaim} from './helpers.ts';

const problem: ArithmeticEstimationProblem = {
    num1: 247,
    num2: 132,
    operation: 'addition',
    roundedNum1: 250,
    roundedNum2: 130,
    roundingPlace: 10,
    exactAnswer: 379,
    estimatedAnswer: 380
};

describe('answer reasonableness projection', () => {
    it('derives deterministic reasonable and unreasonable claims from the seed', () => {
        const reasonable = resolveEstimationClaim(problem, 2);
        const unreasonable = resolveEstimationClaim(problem, 3);

        expect(resolveEstimationClaim(problem, 2)).toEqual(reasonable);
        expect(reasonable).toMatchObject({tolerance: 38, isReasonable: true});
        expect(reasonable.estimateDifference).toBeLessThanOrEqual(reasonable.tolerance);
        expect(unreasonable).toMatchObject({tolerance: 38, isReasonable: false});
        expect(unreasonable.estimateDifference).toBeGreaterThan(unreasonable.tolerance);
    });

    it.each([0, 1000])('keeps both claim classes bounded at estimate %i', estimatedAnswer => {
        const edgeProblem = {...problem, estimatedAnswer};

        for (const seed of [0, 1]) {
            const claim = resolveEstimationClaim(edgeProblem, seed);
            expect(claim.proposedAnswer).toBeGreaterThanOrEqual(0);
            expect(claim.proposedAnswer).toBeLessThanOrEqual(1000);
            expect(claim.isReasonable).toBe(seed === 0);
        }
    });

    it('normalizes non-finite and signed seeds without using global randomness', () => {
        expect(resolveEstimationClaim(problem, Number.NaN)).toEqual(
            resolveEstimationClaim(problem, 0)
        );
        expect(resolveEstimationClaim(problem, -3)).toEqual(
            resolveEstimationClaim(problem, 3)
        );
    });
});
