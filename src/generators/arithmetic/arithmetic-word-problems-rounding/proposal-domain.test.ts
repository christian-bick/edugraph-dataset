import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {ArithmeticWordProblemRounding} from '../../../types/problems.ts';

const entropy = vi.hoisted(() => ({value: 0.5, calls: 0}));
vi.mock('../../../lib/random.ts', () => ({random: () => {
    entropy.calls++;
    return entropy.value;
}}));

import {generateRoundingProposal} from './proposal-domain.ts';

type Context = Pick<ArithmeticWordProblemRounding, 'numberDomain' | 'answer' | 'roundingPlace' | 'roundedAnswer'>;
const context = (min: number, max: number, answer: number, place: Context['roundingPlace']): Context => ({
    numberDomain: {min, max}, answer, roundingPlace: place, roundedAnswer: Math.round(answer / place) * place
});

/** Independent finite oracle: inspect each integer, without using interval formulas. */
const candidates = (data: Context): number[] => {
    const values: number[] = [];
    for (let value = data.numberDomain.min; value <= data.numberDomain.max; value++) {
        const rounded = Math.round(value / data.roundingPlace) * data.roundingPlace;
        if (value !== data.answer && value > 0 && rounded >= data.numberDomain.min
            && rounded <= data.numberDomain.max) values.push(value);
    }
    return values;
};

beforeEach(() => { entropy.value = 0.5; entropy.calls = 0; });

describe('bounded rounding proposal domain', () => {
    it.each([
        ['original hundred boundary', context(1, 100, 100, 100)],
        ['actual thousand boundary', context(1, 1000, 1000, 1000)],
        ['halfway answer', context(1, 1000, 150, 100)],
        ['minimum positive rounded answer', context(1, 10, 5, 10)],
        ['both verdict classes within twenty', context(1, 20, 5, 10)],
        ['positive lower bound', context(100, 200, 100, 100)],
        ['upper rounding tie is excluded', context(50, 250, 150, 100)],
        ['one available alternative', context(100, 101, 100, 100)],
        ['million inclusive upper boundary', context(1, 1_000_000, 999_999, 100_000)]
    ] as const)('reaches every oracle candidate uniformly for %s', (_name, data) => {
        const frozen = Object.freeze({...data, numberDomain: Object.freeze({...data.numberDomain})});
        const snapshot = JSON.stringify(frozen);
        const expected = candidates(frozen);
        expect(expected.length).toBeGreaterThan(0);
        for (let index = 0; index < expected.length; index++) {
            entropy.value = (index + 0.5) / expected.length;
            const before = entropy.calls;
            const actual = generateRoundingProposal(frozen);
            // Direct comparisons keep the million-bound exhaustive pass inexpensive.
            if (!actual || actual.proposedAnswer !== expected[index]
                || actual.roundedProposedAnswer !== Math.round(expected[index]! / data.roundingPlace) * data.roundingPlace
                || entropy.calls !== before + 1) {
                throw new Error(`Proposal bin ${index}/${expected.length} disagrees with the integer oracle.`);
            }
        }
        for (const [draw, expectedValue] of [[0, expected[0]], [1 - Number.EPSILON, expected.at(-1)]] as const) {
            entropy.value = draw;
            expect(generateRoundingProposal(frozen)?.proposedAnswer).toBe(expectedValue);
        }
        expect(JSON.stringify(frozen)).toBe(snapshot);
    });

    it('permits only feasible verdict classes instead of forcing a class balance', () => {
        const hundred = context(1, 100, 100, 100);
        expect(candidates(hundred)).toHaveLength(50);
        expect(candidates(hundred).every(value => Math.round(value / 100) * 100 === 100)).toBe(true);
        const lower = context(1, 10, 5, 10);
        expect(candidates(lower)).toEqual([6, 7, 8, 9, 10]);
        for (const data of [hundred, lower]) {
            for (const draw of [0, 0.25, 0.5, 0.75, 1 - Number.EPSILON]) {
                entropy.value = draw;
                expect(generateRoundingProposal(data)?.roundedProposedAnswer).toBe(data.roundedAnswer);
            }
        }
        const halfway = context(1, 1000, 150, 100);
        expect(new Set(candidates(halfway).map(value => Math.round(value / 100) * 100 === 200)))
            .toEqual(new Set([false, true]));
    });

    it('uses one draw even when only one alternative remains', () => {
        expect(generateRoundingProposal(context(100, 101, 100, 100)))
            .toEqual({proposedAnswer: 101, roundedProposedAnswer: 100});
        expect(entropy.calls).toBe(1);
    });

    it('conditions the same rank law on intervals that omit the exact answer', () => {
        const data = context(1, 1000, 150, 100);
        for (const [allowed, expected] of [[{lower: 100, upper: 110}, Array.from({length: 11}, (_, i) => 100 + i)],
            [{lower: 149, upper: 151}, [149, 151]], [{lower: 900, upper: 900}, [900]]] as const) {
            for (let i = 0; i < expected.length; i++) {
                entropy.value = (i + 0.5) / expected.length;
                expect(generateRoundingProposal(data, allowed)?.proposedAnswer).toBe(expected[i]);
            }
        }
        for (const allowed of [{lower: 0, upper: 100}, {lower: 100, upper: 1001}, {lower: 100, upper: 99},
            {lower: NaN, upper: 100}, {lower: 150, upper: 150}]) {
            const before = entropy.calls;
            expect(generateRoundingProposal(data, allowed)).toBeNull();
            expect(entropy.calls).toBe(before);
        }
    });

    it('returns null without randomness for a valid singleton containing only the exact answer', () => {
        expect(generateRoundingProposal(context(100, 100, 100, 100))).toBeNull();
        expect(entropy.calls).toBe(0);
    });

    it('rejects malformed or numerically infeasible domains without consuming randomness', () => {
        const valid = context(1, 1000, 150, 100);
        const invalid = [
            {...valid, numberDomain: {min: 0, max: 1000}},
            {...valid, numberDomain: {min: -1, max: 1000}},
            {...valid, numberDomain: {min: 1.5, max: 1000}},
            {...valid, numberDomain: {min: 1, max: 1000.5}},
            {...valid, numberDomain: {min: 1001, max: 1000}},
            {...valid, numberDomain: {min: NaN, max: 1000}},
            {...valid, numberDomain: {min: 1, max: Infinity}},
            {...valid, numberDomain: {min: 1, max: 1_000_001}},
            {...valid, answer: 0}, {...valid, answer: 1001}, {...valid, answer: 1.5},
            {...valid, answer: NaN}, {...valid, roundedAnswer: 0},
            {...valid, roundedAnswer: 199}, {...valid, roundedAnswer: 2000},
            context(1, 4, 3, 10), context(1, 5, 5, 10),
            {...valid, roundingPlace: 0}, {...valid, roundingPlace: 1},
            {...valid, roundingPlace: 1_000_000}, {...valid, roundingPlace: Infinity}
        ];
        for (const data of invalid) {
            expect(generateRoundingProposal(data as Context)).toBeNull();
            expect(entropy.calls).toBe(0);
        }
    });
});
