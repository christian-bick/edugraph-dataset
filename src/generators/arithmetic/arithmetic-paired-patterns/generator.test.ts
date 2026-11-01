import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {pairedPatternDomain} from './domain.ts';
import type {ArithmeticPairedPatternProblem} from '../../../types/problems.ts';
import {ArithmeticPairedPatternsGenerator} from './generator.ts';

const generator = new ArithmeticPairedPatternsGenerator();

function expectExactPair(data: ArithmeticPairedPatternProblem): void {
    expect(data.kind).toBe('paired-additive-patterns');
    expect(data.first.terms).toHaveLength(6);
    expect(data.second.terms).toHaveLength(6);
    for (const sequence of [data.first, data.second]) {
        expect(sequence.rule.kind).toBe('add-constant');
        expect(Number.isSafeInteger(sequence.start)).toBe(true);
        expect(sequence.start).toBeGreaterThanOrEqual(0);
        expect(Number.isSafeInteger(sequence.rule.increment)).toBe(true);
        expect(sequence.rule.increment).toBeGreaterThan(0);
        sequence.terms.forEach((term, index) => {
            expect(term).toBe(sequence.start + index * sequence.rule.increment);
            expect(Number.isSafeInteger(term)).toBe(true);
            expect(term).toBeGreaterThanOrEqual(0);
        });
    }

    if (data.correspondence) data.first.terms.forEach((term, index) => {
        const other = data.second.terms[index];
        if (data.correspondence?.kind === 'multiplicative') {
            expect(data.correspondence.factor).toBeGreaterThan(1);
            expect(other).toBe(term * data.correspondence.factor);
        } else if (data.correspondence?.kind === 'additive') {
            expect(data.correspondence.difference).toBeGreaterThan(0);
            expect(other).toBe(term + data.correspondence.difference);
        }
    });
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('blankIndex');
    expect(data).not.toHaveProperty('explanation');
}

afterEach(() => vi.restoreAllMocks());

const frameKey = (data: ArithmeticPairedPatternProblem): string => JSON.stringify([
    data.first.start, data.first.rule.increment, data.second.start, data.second.rule.increment,
    data.correspondence ?? null
]);

describe('ArithmeticPairedPatternsGenerator', () => {
    it('preserves every original frame and the exact pre-conditioning mixture probabilities', () => {
        const random = vi.spyOn(rng, 'random');
        for (const hasCorrespondence of [false, true]) {
            const original = new Map<string, number>();
            const add = (firstStart: number, firstIncrement: number, secondStart: number, secondIncrement: number,
                weight: number, correspondence?: ArithmeticPairedPatternProblem['correspondence']) => {
                const key = JSON.stringify([firstStart, firstIncrement, secondStart, secondIncrement, correspondence ?? null]);
                original.set(key, (original.get(key) ?? 0) + weight);
            };
            if (hasCorrespondence) {
                for (let factor = 2; factor <= 3; factor++) for (let start = 0; start <= 4; start++) for (let increment = 2; increment <= 5; increment++) {
                    add(start, increment, start * factor, increment * factor, 0.6 / (2 * 5 * 4), {kind: 'multiplicative', factor});
                }
                for (let start = 0; start <= 6; start++) for (let increment = 2; increment <= 7; increment++) for (let difference = 2; difference <= 9; difference++) {
                    add(start, increment, start + difference, increment, 0.4 / (7 * 6 * 8), {kind: 'additive', difference});
                }
            } else {
                add(0, 3, 0, 6, 0.2);
                for (let firstStart = 0; firstStart <= 6; firstStart++) for (let firstIncrement = 2; firstIncrement <= 7; firstIncrement++) {
                    for (let secondStart = 0; secondStart <= 6; secondStart++) for (let secondIncrement = 2; secondIncrement <= 7; secondIncrement++) {
                        add(firstStart, firstIncrement, secondStart, secondIncrement, 0.8 / (7 * 6 * 7 * 6));
                    }
                }
            }
            const seen = new Set<string>();
            let originalMass = 0;
            for (const upper of hasCorrespondence ? [20, 100] : [10, 20, 100]) {
                const range = createCanonicalNumericRange(upper);
                const candidates = pairedPatternDomain(hasCorrespondence, range);
                const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
                let cumulative = 0;
                for (const candidate of candidates) {
                    random.mockReset().mockReturnValue((cumulative + candidate.weight / 2) / total);
                    const {data} = generator.generate({hasCorrespondence, range});
                    expect(random).toHaveBeenCalledTimes(1);
                    expectExactPair(data);
                    expect(Boolean(data.correspondence)).toBe(hasCorrespondence);
                    const relation = data.correspondence;
                    const values = [0, 1, 2, 3, 4, 5, data.first.rule.increment, data.second.rule.increment,
                        ...data.first.terms, ...data.second.terms,
                        ...(relation ? [relation.kind === 'multiplicative' ? relation.factor : relation.difference] : [])];
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    const key = frameKey(data);
                    expect(seen.has(key)).toBe(false);
                    expect(candidate.weight).toBeCloseTo(original.get(key)!, 14);
                    seen.add(key);
                    cumulative += candidate.weight;
                    originalMass += candidate.weight;
                }
            }
            expect(seen).toEqual(new Set(original.keys()));
            expect(seen.size).toBe(hasCorrespondence ? 376 : 1764);
            expect(originalMass).toBeCloseTo(1, 12);
        }
    });

    it('keeps the exact zero-start add3/add6 standard example and its original extra probability mass', () => {
        const candidates = pairedPatternDomain(false, createCanonicalNumericRange(100));
        const example = candidates.find(frame => frame.firstStart === 0 && frame.firstIncrement === 3
            && frame.secondStart === 0 && frame.secondIncrement === 6)!;
        expect(example.weight).toBeCloseTo(0.2 + 0.8 / 1764, 14);
    });

    it('rejects malformed and infeasible configurations before consuming randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, {hasCorrespondence: false},
            {hasCorrespondence: 'unsupported', range: createCanonicalNumericRange(20)},
            {hasCorrespondence: true, range: createCanonicalNumericRange(10)},
            {hasCorrespondence: true, range: createCanonicalNumericRange(100, 5)},
            {hasCorrespondence: false, range: createCanonicalNumericRange(5)},
            {hasCorrespondence: false, range: {min: 0, max: 20}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('replays independently of mutations to previously returned sequence and relation objects', () => {
        for (const hasCorrespondence of [false, true]) {
            const config = {hasCorrespondence, range: createCanonicalNumericRange(100)};
            rng.setSeed(88);
            const first = generator.generate(config);
            const expected = structuredClone(first);
            const continuation = rng.getRandomState();
            (first.data.first.terms as number[]).push(999);
            if (first.data.correspondence?.kind === 'additive') first.data.correspondence.difference = 999;
            if (first.data.correspondence?.kind === 'multiplicative') first.data.correspondence.factor = 999;
            rng.setSeed(88);
            expect(generator.generate(config)).toEqual(expected);
            expect(rng.getRandomState()).toBe(continuation);
        }
    });
});
