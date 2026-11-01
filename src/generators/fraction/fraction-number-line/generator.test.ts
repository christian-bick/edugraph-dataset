import { afterEach, describe, expect, it, vi } from 'vitest';
import * as rng from '../../../lib/random.ts';
import { setSeed } from '../../../lib/random.ts';
import { createCanonicalNumericRange, hasCanonicalRangeWitness } from '../../../lib/canonical-numeric-range.ts';
import { FractionNumberLineGenerator } from './generator.ts';
import { fractionLineCandidates, type FractionLineKind } from './domain.ts';
afterEach(() => vi.restoreAllMocks());
const generator = new FractionNumberLineGenerator();
const kinds = ['unit', 'nonunit', 'improper'] as const;
const denominators = [2, 3, 4, 6, 8];
const original = (kind: FractionLineKind) => denominators.flatMap(denominator => Array.from({ length: 2 * denominator - 1 }, (_, i) => i + 1)
    .filter(n => kind === 'unit' ? n === 1 : kind === 'nonunit' ? n > 1 && n < denominator : n > denominator)
    .map(numerator => ({ numerator, denominator })));
describe('FractionNumberLineGenerator canonical count profiles', () => {
    it.each(kinds)('retains every original %s fraction exactly once across its canonical bands', fractionType => {
        const random = vi.spyOn(rng, 'random');
        const seen = new Set<string>();
        for (const upper of [5, 10, 20]) {
            const range = createCanonicalNumericRange(upper);
            const expected = original(fractionType).filter(({ numerator: n, denominator: d }) => Math.max(n, d) <= upper && Math.max(n, d) > range.maximumAbove);
            expect(fractionLineCandidates(fractionType, range)).toEqual(expected);
            if (!expected.length) {
                expect(() => generator.generate({ fractionType, range })).toThrow('No values');
                continue;
            }
            for (const [index, pair] of expected.entries()) {
                random.mockClear().mockReturnValue((index + 0.5) / expected.length);
                const { data } = generator.generate({ fractionType, range });
                expect(data).toEqual({ task: 'locate-fraction', ...pair, wholeCount: pair.numerator > pair.denominator ? 2 : 1,
                    steps: Array.from({ length: pair.numerator }, (_, i) => ({ fromNumerator: i, toNumerator: i + 1 })) });
                // Partition and iteration cardinalities are assessed; the line itself includes zero.
                expect(hasCanonicalRangeWitness([0, data.wholeCount, data.numerator / data.denominator, 1 / data.denominator, data.numerator, data.denominator], range)).toBe(true);
                expect(random).toHaveBeenCalledTimes(1);
                seen.add(JSON.stringify(pair));
            }
        }
        expect(seen).toEqual(new Set(original(fractionType).map(pair => JSON.stringify(pair))));
        expect(seen.size).toBe(fractionType === 'unit' ? 5 : fractionType === 'nonunit' ? 13 : 18);
    });
    it('rejects unsupported kinds and malformed ranges before sampling', () => {
        const random = vi.spyOn(rng, 'random');
        expect(() => generator.generate({})).toThrow();
        for (const config of [
            { fractionType: 'other', range: createCanonicalNumericRange(5) },
            { fractionType: 'unit', range: createCanonicalNumericRange(100) },
            { fractionType: 'unit', range: createCanonicalNumericRange(10, 5) },
            { fractionType: 'unit', range: { min: 0, max: 5 } },
            { fractionType: 'unit', range: { ...createCanonicalNumericRange(5), minimumBelow: 10 } }
        ])
            expect(() => generator.generate(config as never)).toThrow();
        expect(random).not.toHaveBeenCalled();
    });
    it('retains deterministic payloads for a selected configuration', () => {
        const config = { fractionType: 'improper', range: createCanonicalNumericRange(20) } as const;
        setSeed('fraction-count-ranges');
        const first = generator.generate(config);
        setSeed('fraction-count-ranges');
        expect(generator.generate(config)).toEqual(first);
    });
});
