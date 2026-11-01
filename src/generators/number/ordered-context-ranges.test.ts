import assert from 'node:assert/strict';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {makeSignedRational} from './signed-rational-helpers.ts';
import {buildOrderedContextPair} from './ordered-context-helpers.ts';
import {orderedContextCaseCount, orderedContextFrameAt, orderedContextRangeProfiles,
    orderedContextRawPathCount, sampleCanonicalOrderedContextPair, type ContextSignDomain} from './ordered-context-ranges.ts';

const contexts = ['temperature', 'elevation', 'balance'] as const;
const denominators = (context: string) => context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6];
const patterns = (domain: ContextSignDomain) => domain === 'signed' ? [0, 1, 2, 3] : [4];
const pathDenominator = (domain: ContextSignDomain, context: string, d: number, pattern: number) => {
    const maximum = 10 * d;
    return 3 * denominators(context).length * patterns(domain).length
        * (pattern === 4 ? maximum + 1 : maximum)
        * (pattern === 4 ? maximum : pattern === 0 || pattern === 3 ? maximum - 1 : 1) * 2;
};
const commonDenominator = (domain: ContextSignDomain) => {
    let common = 1n;
    for (const context of contexts) for (const d of denominators(context)) for (const pattern of patterns(domain)) {
        const denominator = BigInt(pathDenominator(domain, context, d, pattern));
        let a = common, b = denominator;
        while (b) [a, b] = [b, a % b];
        common = common / a * denominator;
    }
    return Number(common);
};
afterEach(() => vi.restoreAllMocks());

describe('canonical context bands preserve the complete weighted mathematical domain', () => {
    it.each(['signed', 'nonnegative'] as const)('exhausts every original %s path without dropping threshold endpoints', domain => {
        const base = commonDenominator(domain);
        const rawCounts: number[] = [], weightedCounts: number[] = [];
        for (const {range} of orderedContextRangeProfiles) {
            let ticket = 0, rawPaths = 0;
            for (const context of contexts) for (const d of denominators(context)) for (const pattern of patterns(domain)) {
                const maximum = 10 * d, weight = base / pathDenominator(domain, context, d, pattern);
                assert(Number.isSafeInteger(weight));
                for (let n = pattern === 4 ? 0 : 1; n <= maximum; n++) {
                    const other = pattern === 1 || pattern === 2 ? [0]
                        : Array.from({length: maximum + (pattern === 4 ? 1 : 0)}, (_, index) => index + (pattern === 4 ? 0 : 1))
                            .filter(m => m !== n);
                    for (const m of other) {
                        const magnitude = Math.max(n, pattern === 1 ? n : m) / d;
                        if ((range.max === 5) !== (magnitude <= 5)) continue;
                        for (const swapped of [false, true]) {
                            const expected = {context, denominator: d, pattern, numerator: n, otherNumerator: m, swapped};
                            assert.deepEqual(orderedContextFrameAt(domain, range, ticket), expected);
                            assert.deepEqual(orderedContextFrameAt(domain, range, ticket + weight - 1), expected);
                            // Every retained path contains a realizable32-bit random-grid interval.
                            const nativeGrid = Math.ceil(ticket * 4294967296 / orderedContextCaseCount(domain, range)) / 4294967296;
                            const nativeIndex = Math.floor(nativeGrid * orderedContextCaseCount(domain, range));
                            assert(nativeIndex >= ticket && nativeIndex < ticket + weight);
                            assert(magnitude > 0 && magnitude <= range.max && (range.max === 5 || magnitude > 5));
                            ticket += weight;
                            rawPaths++;
                        }
                    }
                }
            }
            expect(ticket).toBe(orderedContextCaseCount(domain, range));
            expect(rawPaths).toBe(orderedContextRawPathCount(domain, range));
            weightedCounts.push(ticket);
            rawCounts.push(rawPaths);
        }
        expect(weightedCounts.reduce((sum, count) => sum + count, 0)).toBe(base);
        expect(rawCounts.reduce((sum, count) => sum + count, 0)).toBe(domain === 'signed' ? 91200 : 46680);
        expect(base).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it('constructs the original exact rationals, nominal order and datum from weighted boundary tickets', () => {
        const spy = vi.spyOn(rng, 'random');
        const covered = new Set<string>();
        for (const domain of ['signed', 'nonnegative'] as const) for (const {range} of orderedContextRangeProfiles) {
            const count = orderedContextCaseCount(domain, range);
            // These deterministic tickets exercise every context, denominator, pattern and orientation.
            for (let draw = 0; draw < 2400; draw++) {
                const index = Math.floor((draw + 0.5) * count / 2400);
                const frame = orderedContextFrameAt(domain, range, index);
                spy.mockReturnValueOnce((index + 0.5) / count);
                const first = makeSignedRational(frame.pattern === 4 ? frame.numerator : -frame.numerator, frame.denominator);
                const second = makeSignedRational(frame.pattern === 0 ? -frame.otherNumerator
                    : frame.pattern === 1 ? frame.numerator : frame.pattern === 2 ? 0 : frame.otherNumerator, frame.denominator);
                const expected = frame.swapped ? buildOrderedContextPair(frame.context, second, first)
                    : buildOrderedContextPair(frame.context, first, second);
                assert.deepEqual(sampleCanonicalOrderedContextPair(domain, range), expected);
                covered.add(`${domain}:${frame.context}:${frame.denominator}:${frame.pattern}:${frame.swapped}`);
            }
        }
        for (const domain of ['signed', 'nonnegative'] as const) for (const context of contexts)
            for (const d of denominators(context)) for (const pattern of patterns(domain)) for (const swapped of [false, true])
                expect(covered.has(`${domain}:${context}:${d}:${pattern}:${swapped}`)).toBe(true);
    });

    it('rejects unavailable profiles and invalid indices before consuming randomness', () => {
        const spy = vi.spyOn(rng, 'random');
        const range = orderedContextRangeProfiles[0]!.range;
        for (const bad of [{...range, min: 5}, {...range, max: 20}, {...range, maximumAbove: 0}]) {
            expect(orderedContextCaseCount('signed', bad)).toBe(0);
            expect(() => sampleCanonicalOrderedContextPair('signed', bad)).toThrow(GeneratorValidationError);
        }
        expect(orderedContextRawPathCount('unrestricted', range)).toBe(0);
        for (const index of [-1, 0.5, Infinity, NaN, orderedContextCaseCount('signed', range)])
            expect(() => orderedContextFrameAt('signed', range, index)).toThrow(RangeError);
        expect(() => orderedContextFrameAt('unrestricted', range, 0)).toThrow(RangeError);
        expect(spy).not.toHaveBeenCalled();
    });
});
