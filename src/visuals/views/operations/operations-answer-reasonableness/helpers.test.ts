import {describe, expect, it} from 'vitest';
import {Area} from 'edugraph-ts';
import {ArithmeticEstimationGenerator} from '../../../../generators/arithmetic/arithmetic-estimation/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {resolveEstimationClaim} from './helpers.ts';

const problem: ArithmeticEstimationProblem = {
    numberDomain: {min: 0, max: 1000},
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
            proposedAnswer: 378,
            roundedEstimatedAnswer: 380,
            roundedProposedAnswer: 380,
            isReasonable: true
        });
        expect(unreasonable.roundedProposedAnswer).not.toBe(380);
        expect(unreasonable).toMatchObject({
            proposedAnswer: 369,
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
            numberDomain: {min: 0, max: 1000},
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

    it('uses the mathematical domain when rounding extends below the canonical value hull', () => {
        const division: ArithmeticEstimationProblem = {
            numberDomain: {min: 0, max: 1000}, num1: 42, num2: 21, operation: 'division',
            roundedNum1: 40, roundedNum2: 20, roundingPlace: 10, exactAnswer: 2, estimatedAnswer: 2
        };
        expect(resolveEstimationClaim(division, 0)).toMatchObject({
            proposedAnswer: 3, roundedProposedAnswer: 0, roundedEstimatedAnswer: 0, isReasonable: true
        });
    });

    it.each([0, 10, 20])('keeps both verdicts and all rounded evidence within twenty for estimate %i', estimatedAnswer => {
        const small = {...problem, numberDomain: {min: 0, max: 20}, estimatedAnswer};
        for (let seed = 0; seed < 100; seed++) {
            const claim = resolveEstimationClaim(small, seed);
            expect(claim).toEqual(resolveEstimationClaim(small, seed));
            expect(claim.isReasonable).toBe(seed % 2 === 0);
            expect(claim.proposedAnswer).not.toBe(estimatedAnswer);
            expect([claim.proposedAnswer, claim.roundedProposedAnswer, claim.roundedEstimatedAnswer]
                .every(value => value >= 0 && value <= 20)).toBe(true);
        }
    });

    it('uses a finite deterministic fallback when both preferred distances leave the domain', () => {
        const small = {...problem, numberDomain: {min: 0, max: 20}, estimatedAnswer: 10};
        const claim = resolveEstimationClaim(small, 3); // The original candidates are -1 and 21.
        expect(claim).toEqual({proposedAnswer: 3, roundedProposedAnswer: 0, roundedEstimatedAnswer: 10, isReasonable: false});
    });

    it('respects a positive lower bound for proposals and their rounded forms', () => {
        const bounded = {...problem, numberDomain: {min: 10, max: 20}, estimatedAnswer: 10};
        for (let seed = 0; seed < 40; seed++) {
            const claim = resolveEstimationClaim(bounded, seed);
            expect(claim.isReasonable).toBe(seed % 2 === 0);
            expect([claim.proposedAnswer, claim.roundedProposedAnswer, claim.roundedEstimatedAnswer]
                .every(value => value >= 10 && value <= 20)).toBe(true);
        }
    });

    it('rejects impossible verdicts instead of changing the requested classification', () => {
        const tiny = {...problem, numberDomain: {min: 0, max: 4}, estimatedAnswer: 0};
        expect(resolveEstimationClaim(tiny, 0).isReasonable).toBe(true);
        expect(() => resolveEstimationClaim(tiny, 1)).toThrow('requested reasonableness classification');
    });

    it.each([{min: -1, max: 20}, {min: 0, max: 1001}, {min: 1.5, max: 20}, {min: 20, max: 10}])(
        'rejects invalid domain %j', numberDomain => {
            expect(() => resolveEstimationClaim({...problem, numberDomain}, 0)).toThrow('Invalid estimation number domain');
        }
    );

    it('rejects an out-of-domain displayed rounded estimate', () => {
        expect(() => resolveEstimationClaim({...problem, numberDomain: {min: 1, max: 20}, estimatedAnswer: 2}, 0))
            .toThrow('rounded estimate lies outside');
    });

    it.each([{min: 0, max: 10}, {min: 0, max: 20}, {min: 0, max: 1000}, {min: 30, max: 1000}])(
        'supports both verdicts for every operation across seeded emitted data in %j', range => {
            const generator = new ArithmeticEstimationGenerator();
            for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const) {
                for (let seed = 0; seed < 12; seed++) {
                    setSeed(seed);
                    const generated = generator.generate({operation, range});
                    expect(generated).not.toBeNull();
                    for (const claimSeed of [2 * seed, 2 * seed + 1]) {
                        const claim = resolveEstimationClaim(generated!.data, claimSeed);
                        expect(claim.isReasonable).toBe(claimSeed % 2 === 0);
                        expect([claim.proposedAnswer, claim.roundedProposedAnswer, claim.roundedEstimatedAnswer]
                            .every(value => value >= range.min && value <= range.max)).toBe(true);
                    }
                }
            }
        }
    );
});
