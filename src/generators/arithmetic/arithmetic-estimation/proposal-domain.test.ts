import {describe, expect, it} from 'vitest';
import {getRandomState} from '../../../lib/random.ts';
import {estimationProposalCases, estimationProposalForSeed, proposalSeedCount} from './proposal-domain.ts';

describe('canonical estimation proposal seed measure', () => {
    it('matches exhaustive small seed domains, including fallback orbits and truncated periods', () => {
        for (const numberDomain of [{min: 0, max: 20}, {min: 10, max: 20}, {min: 0, max: 1000}]) {
            for (const estimatedAnswer of [numberDomain.min, 10, numberDomain.max]) {
                const context = {numberDomain, estimatedAnswer, roundingPlace: 10 as const};
                for (const size of [1, 19, 20, 21, 137, 1001]) {
                    const expected = new Map<number, number>();
                    for (let seed = 0; seed < size; seed++) {
                        const proposal = estimationProposalForSeed(context, seed);
                        if (proposal) expected.set(proposal.proposedAnswer, (expected.get(proposal.proposedAnswer) ?? 0) + 1);
                    }
                    const actual = estimationProposalCases(context, size);
                    expect(new Map(actual.map(proposal => [proposal.proposedAnswer, proposal.seeds]))).toEqual(expected);
                    for (const proposal of actual) expect(estimationProposalForSeed(context, proposal.witnessSeed))
                        .toEqual({proposedAnswer: proposal.proposedAnswer, roundedProposedAnswer: proposal.roundedProposedAnswer});
                }
            }
        }
    });

    it('covers every unsigned32 seed with exact positive integer counts and both verdicts', () => {
        for (const max of [20, 1000]) for (let estimatedAnswer = 0; estimatedAnswer <= max; estimatedAnswer++) {
            const context = {numberDomain: {min: 0, max}, estimatedAnswer, roundingPlace: 10 as const};
            const state = getRandomState(), cases = estimationProposalCases(context);
            expect(getRandomState()).toBe(state);
            expect(estimationProposalCases(context)).toBe(cases);
            expect(cases.reduce((sum, proposal) => sum + proposal.seeds, 0)).toBe(proposalSeedCount);
            expect(cases.every(proposal => Number.isSafeInteger(proposal.seeds) && proposal.seeds > 0)).toBe(true);
            expect(cases.filter(proposal => proposal.roundedProposedAnswer === Math.round(estimatedAnswer / 10) * 10)
                .reduce((sum, proposal) => sum + proposal.seeds, 0)).toBe(proposalSeedCount / 2);
            for (const seed of [0, 1, 19, 20, 1234567, 0xfffffffe, 0xffffffff]) {
                const proposal = estimationProposalForSeed(context, seed)!;
                expect(cases.some(value => value.proposedAnswer === proposal.proposedAnswer)).toBe(true);
            }
        }
    });

    it('retains original deterministic proposal witnesses and rejects impossible classifications', () => {
        const context = {numberDomain: {min: 0, max: 1000}, estimatedAnswer: 380, roundingPlace: 10 as const};
        expect(estimationProposalForSeed(context, 2)?.proposedAnswer).toBe(378);
        expect(estimationProposalForSeed(context, 3)?.proposedAnswer).toBe(369);
        expect(estimationProposalForSeed(context, -3)).toEqual(estimationProposalForSeed(context, 3));
        expect(estimationProposalForSeed(context, NaN)).toEqual(estimationProposalForSeed(context, 0));
        const tiny = {numberDomain: {min: 0, max: 4}, estimatedAnswer: 0, roundingPlace: 10 as const};
        expect(estimationProposalForSeed(tiny, 1)).toBeNull();
        expect(estimationProposalCases(tiny).reduce((sum, proposal) => sum + proposal.seeds, 0)).toBe(proposalSeedCount / 2);
        for (const size of [0, 1.5, 2 ** 32 + 1]) expect(() => estimationProposalCases(context, size)).toThrow('seed count');
    });
});
