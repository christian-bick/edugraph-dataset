import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import type {EquationJudgmentProblem} from '../../../types/problems.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';
import {ArithmeticEquationJudgmentGeneratorSchema as schema} from './spec.ts';
import {judgmentDomain, judgmentQuantities} from './domain.ts';
import {isCanonicalJudgment} from './claims.ts';

afterEach(() => vi.restoreAllMocks());

/** Independently enumerate the original exact relations and bounded neighboring proposals. */
const originalSupport = (): EquationJudgmentProblem[] => {
    const result: EquationJudgmentProblem[] = [];
    const append = (num1: number, num2: number, operation: 'addition' | 'subtraction') => {
        const answer = operation === 'addition' ? num1 + num2 : num1 - num2;
        for (const claimedAnswer of [answer, answer > 0 ? answer - 1 : 1]) {
            result.push({num1, num2, operation, answer, claimedAnswer});
        }
    };
    for (let first = 1; first <= 20; first++) {
        append(0, first, 'addition');
        append(first, first, 'subtraction');
        for (let second = 1; first + second <= 20; second++) {
            append(first, second, 'addition');
            append(first + second, first, 'subtraction');
        }
    }
    return result;
};

const key = (data: EquationJudgmentProblem): string =>
    [data.operation, data.num1, data.num2, data.answer, data.claimedAnswer].join(':');

describe('ArithmeticEquationJudgmentGenerator', () => {
    const generator = new ArithmeticEquationJudgmentGenerator();

    it('retains all 840 original claims exactly once across 18 feasible canonical profiles', () => {
        const random = vi.spyOn(rng, 'random');
        const seen = new Set<string>();
        const counts: Record<string, number> = {};
        expect(schema.profile[2]).toHaveLength(18);
        for (const labels of schema.profile[2]) {
            const config = extractConfig(schema, [...labels]).config;
            const profile = config.profile!;
            const candidates = judgmentDomain(profile);
            expect(candidates.length).toBeGreaterThan(0);
            for (const [index, expected] of candidates.entries()) {
                random.mockClear().mockReturnValue((index + 0.5) / candidates.length);
                const {data} = generator.generate(config);
                expect(data).toEqual(expected);
                expect(random).toHaveBeenCalledTimes(1);
                expect(isCanonicalJudgment(data)).toBe(true);
                expect(hasCanonicalRangeWitness(judgmentQuantities(data), profile.range)).toBe(true);
                expect(judgmentQuantities(data).includes(0)).toBe(profile.relation.endsWith('-zero'));
                expect(data).not.toHaveProperty('isTrue');
                expect(seen.has(key(data))).toBe(false);
                seen.add(key(data));
                counts[profile.relation] = (counts[profile.relation] ?? 0) + 1;
            }
        }
        expect(seen).toEqual(new Set(originalSupport().map(key)));
        expect(seen.size).toBe(840);
        expect(counts).toEqual({'addition-positive': 380, 'addition-zero': 40,
            'subtraction-positive': 361, 'subtraction-zero': 59});
    });

    it('uses both the proposed and the correct answer as range and zero witnesses', () => {
        const zero = judgmentDomain({relation: 'subtraction-zero', range: createCanonicalNumericRange(20)});
        expect(zero).toContainEqual({num1: 20, num2: 19, operation: 'subtraction', answer: 1, claimedAnswer: 0});
        const positive = judgmentDomain({relation: 'subtraction-positive', range: createCanonicalNumericRange(20, 10)});
        expect(positive).toContainEqual({num1: 20, num2: 10, operation: 'subtraction', answer: 10, claimedAnswer: 10});
        expect(positive).not.toContainEqual({num1: 20, num2: 10, operation: 'subtraction', answer: 10, claimedAnswer: 9});
    });

    it('rejects malformed and infeasible profiles before consuming randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, {profile: {}},
            {profile: {relation: 'multiplication-positive', range: createCanonicalNumericRange(20)}},
            {profile: {relation: 'addition-positive', range: createCanonicalNumericRange(100)}},
            {profile: {relation: 'addition-positive', range: {min: 10, max: 5}}},
            {profile: {relation: 'addition-positive', range: {min: 0, max: 20}}},
            {profile: {relation: 'addition-zero', range: createCanonicalNumericRange(20, 10)}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('does not allow mutation of one generated object to alter the finite pool', () => {
        vi.spyOn(rng, 'random').mockReturnValue(0);
        const config = extractConfig(schema, [...schema.profile[2][0]!]).config;
        const first = generator.generate(config);
        const expected = {...first.data};
        first.data.num1 = 999;
        expect(generator.generate(config).data).toEqual(expected);
    });
});
