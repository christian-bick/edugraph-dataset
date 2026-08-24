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
        expect(reasonable).toMatchObject({
            roundedEstimatedAnswer: 380,
            roundedProposedAnswer: 380,
            isReasonable: true
        });
        expect(unreasonable.roundedProposedAnswer).not.toBe(380);
        expect(unreasonable).toMatchObject({
            roundedEstimatedAnswer: 380,
            isReasonable: false
        });
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

    it('uses the displayed nearest-ten strategy for small division estimates', () => {
        const division: ArithmeticEstimationProblem = {
            num1: 270,
            num2: 27,
            operation: 'division',
            roundedNum1: 270,
            roundedNum2: 30,
            roundingPlace: 10,
            exactAnswer: 10,
            estimatedAnswer: 9
        };

        for (const seed of [0, 2, 4, 6]) {
            const claim = resolveEstimationClaim(division, seed);
            expect(claim.roundedProposedAnswer).toBe(10);
            expect(claim.isReasonable).toBe(true);
        }
        for (const seed of [1, 3, 5, 7]) {
            const claim = resolveEstimationClaim(division, seed);
            expect(claim.roundedProposedAnswer).not.toBe(10);
            expect(claim.isReasonable).toBe(false);
        }
    });
});
