import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import type {KnownFactDerivationProblem, KnownFactDerivationStrategy} from '../../../types/problems.ts';
import {ArithmeticKnownFactDerivationGenerator} from './generator.ts';
import type {ArithmeticKnownFactDerivationGeneratorConfig} from './spec.ts';
import {knownFactDomain, knownFactQuantities} from './domain.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new ArithmeticKnownFactDerivationGenerator();
const configFor = (strategy: KnownFactDerivationStrategy, upper: number, lower = 0): ArithmeticKnownFactDerivationGeneratorConfig => ({
    operation: strategy === 'inverse-division' ? 'division' : 'multiplication',
    arity: strategy === 'associative' ? Scope.ThreeOperands : Scope.TwoOperands,
    useCommutativeLaw: strategy === 'commutative', useAssociativeLaw: strategy === 'associative',
    usePlaceValueScaling: strategy === 'place-value-scaling', range: createCanonicalNumericRange(upper, lower)
});
const key = (data: KnownFactDerivationProblem): string => JSON.stringify([data.strategy,
    data.knownFact.firstFactor, data.knownFact.secondFactor, data.knownFact.product, data.derivedOperands, data.answer]);

/** Independent enumeration of the original complete authored factors, not just active source ceilings. */
const originalFrames = (strategy: KnownFactDerivationStrategy): Set<string> => {
    const result = new Set<string>();
    for (let first = 2; first <= 9; first++) for (let second = 2; second <= 9; second++) {
        const product = first * second;
        const knownFact = {firstFactor: first, secondFactor: second, product};
        if (strategy === 'commutative' && first !== second) result.add(key({strategy, operation: 'multiplication', knownFact, derivedOperands: [second, first], answer: product}));
        if (strategy === 'inverse-division') result.add(key({strategy, operation: 'division', knownFact, derivedOperands: [product, first], answer: second}));
        if (strategy === 'place-value-scaling') result.add(key({strategy, operation: 'multiplication', knownFact, derivedOperands: [first, second * 10], answer: product * 10}));
        if (strategy === 'associative') for (let outer = 2; outer <= 9; outer++) {
            result.add(key({strategy, operation: 'multiplication', knownFact, derivedOperands: [outer, first, second], answer: outer * product}));
        }
    }
    return result;
};

describe('canonical known-fact derivation', () => {
    it.each([['commutative', 56], ['associative', 512], ['inverse-division', 64], ['place-value-scaling', 64]] as const)(
        'preserves all %s frames, one uniform draw and strongest bounds', (strategy, count) => {
            const random = vi.spyOn(rng, 'random');
            const seen = new Set<string>();
            for (const {range} of canonicalRangeProfiles.filter(profile => profile.range.max <= 1000 && [0, 5].includes(profile.range.min))) {
                const candidates = knownFactDomain(strategy, range);
                for (const [index, expected] of candidates.entries()) {
                    random.mockReset().mockReturnValue((index + 0.5) / candidates.length);
                    const {data} = generator.generate(configFor(strategy, range.max, range.min))!;
                    expect(data).toEqual(expected);
                    expect(random).toHaveBeenCalledTimes(1);
                    expect(data.knownFact.product).toBe(data.knownFact.firstFactor * data.knownFact.secondFactor);
                    expect(data.answer).toBe(strategy === 'inverse-division'
                        ? data.derivedOperands[0] / data.derivedOperands[1]
                        : data.derivedOperands.reduce((product, factor) => product * factor, 1));
                    expect(hasCanonicalRangeWitness(knownFactQuantities(data), range)).toBe(true);
                    expect(data).not.toHaveProperty('prompt');
                    expect(data).not.toHaveProperty('questionEquation');
                    expect(seen.has(key(data))).toBe(false);
                    seen.add(key(data));
                }
            }
            expect(seen.size).toBe(count);
            expect(seen).toEqual(originalFrames(strategy));
        }
    );

    it('retains all old property cases and includes legitimate inclusive20 endpoints', () => {
        const commutative = knownFactDomain('commutative', createCanonicalNumericRange(20));
        expect(commutative).toContainEqual({strategy: 'commutative', operation: 'multiplication',
            knownFact: {firstFactor: 4, secondFactor: 5, product: 20}, derivedOperands: [5, 4], answer: 20});
        const associative = knownFactDomain('associative', createCanonicalNumericRange(20));
        expect(associative.filter(data => data.answer === 20)).toHaveLength(3);
        expect(knownFactDomain('place-value-scaling', createCanonicalNumericRange(120)).some(data => data.answer === 120)).toBe(true);
    });

    it.each([100, 120, 1000])('retains upper%s scaling payloads and the original one-draw continuation', upper => {
        const config = configFor('place-value-scaling', upper);
        const expected = knownFactDomain('place-value-scaling', config.range!);
        expect(expected.length).toBeGreaterThan(0);
        for (let seed = 0; seed < 32; seed++) {
            rng.setSeed(seed);
            const index = Math.floor(rng.random() * expected.length), state = rng.getRandomState();
            rng.setSeed(seed);
            const result = generator.generate(config)!;
            expect(result.data).toEqual(expected[index]);
            expect(result.data.derivedOperands[0] % 10).not.toBe(0);
            expect(result.data.derivedOperands[1] % 10).toBe(0);
            expect(rng.getRandomState()).toBe(state);
        }
    });

    it('keeps broad fluency and explicit commutativity as the same mathematical manifestation', () => {
        const explicit = configFor('commutative', 100);
        rng.setSeed(41);
        const first = generator.generate(explicit);
        rng.setSeed(41);
        expect(generator.generate({...explicit, useCommutativeLaw: false})).toEqual(first);
    });

    it('rejects invalid configuration and impossible strategy combinations before randomness', () => {
        const random = vi.spyOn(rng, 'random');
        const valid = configFor('commutative', 20);
        for (const config of [undefined, {}, {...valid, operation: 'addition'}, {...valid, arity: 'four-operands'},
            {...valid, range: {min: 0, max: 20}}, {...valid, range: createCanonicalNumericRange(100, 10)},
            {...valid, range: createCanonicalNumericRange(10000)}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        for (const config of [{...valid, operation: 'division'}, {...valid, arity: Scope.ThreeOperands},
            {...valid, usePlaceValueScaling: true}, configFor('commutative', 5), configFor('place-value-scaling', 20)]) {
            expect(generator.generate(config as never)).toBeNull();
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('replays while keeping the returned known fact and operand arrays independent', () => {
        const config = configFor('associative', 1000, 5);
        rng.setSeed('known-fact-replay');
        const first = generator.generate(config)!;
        const expected = structuredClone(first), continuation = rng.getRandomState();
        first.data.knownFact.firstFactor = 999;
        (first.data.derivedOperands as unknown as number[]).push(999);
        rng.setSeed('known-fact-replay');
        expect(generator.generate(config)).toEqual(expected);
        expect(rng.getRandomState()).toBe(continuation);
    });
});
