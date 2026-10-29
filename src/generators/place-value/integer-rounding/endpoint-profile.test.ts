import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {hasEndpointProfile, resolveZeroEndpoint, roundingPlaces} from './endpoint-profile.ts';
import {IntegerRoundingGenerator} from './generator.ts';
import {IntegerRoundingGeneratorSchema} from './spec.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new IntegerRoundingGenerator();

describe('rounding endpoint occurrence profiles', () => {
    it('keeps standalone fallbacks valid and resolves actual selected magnitude context', () => {
        expect(findSchemaFallbackContractIssues(IntegerRoundingGeneratorSchema)).toEqual([]);
        expect(resolveZeroEndpoint([Scope.NumbersWithZero])).toBe(true);
        expect(resolveZeroEndpoint([Scope.NumbersWithoutZero])).toBe(false);
        expect(resolveZeroEndpoint([Scope.StepsOf10, Scope.NumbersSmaller1000000])).toBe(false);
        expect(resolveZeroEndpoint([Scope.StepsOf10000, Scope.NumbersSmaller1000000])).toBeUndefined();
        expect(resolveZeroEndpoint([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveZeroEndpoint([Scope.StepsOf10, Scope.StepsOf100])).toBeUndefined();
        expect(() => generator.generate({range: {min: 0, max: 1000}, roundingMagnitude: Scope.StepsOf10}))
            .toThrow(/zeroEndpoint/);
    });

    it.each([
        [{min: 0, max: 1000}, 10, true, true],
        [{min: 0, max: 1000}, 100, true, true],
        [{min: 1000, max: 1000000}, 10, false, true],
        [{min: 1000, max: 1000000}, 100, false, true],
        [{min: 1000, max: 1000000}, 1000, false, true],
        [{min: 1000, max: 1000000}, 10000, true, true],
        [{min: 1000, max: 1000000}, 100000, true, true],
        [{min: 1000, max: 1001}, 10000, true, false],
        [{min: 1500, max: 1500}, 1000, false, true],
        [{min: 1499, max: 1499}, 1000, false, false],
        [{min: 995, max: 1000}, 100, false, false]
    ] as const)('matches the original numeric support for range %j and place %i', (range, place, zero, positive) => {
        expect(hasEndpointProfile(range, place, true)).toBe(zero);
        expect(hasEndpointProfile(range, place, false)).toBe(positive);
    });

    it.each([[Scope.StepsOf10, 10], [Scope.StepsOf100, 100]] as const)(
        'retains every legacy interval and offset exactly once for %s', (roundingMagnitude, place) => {
            const random = vi.spyOn(rng, 'random');
            const originalLast = Math.floor((1000 - place - 1) / place);
            const all = new Set<number>();
            for (const zeroEndpoint of [true, false]) {
                const first = zeroEndpoint ? 0 : 1;
                const last = zeroEndpoint ? 0 : originalLast;
                for (let interval = first; interval <= last; interval++) {
                    for (let offset = 1; offset < place; offset++) {
                        random.mockReturnValueOnce((interval - first + 0.5) / (last - first + 1))
                            .mockReturnValueOnce((offset - 0.5) / (place - 1));
                        const data = generator.generate({range: {min: 0, max: 1000}, roundingMagnitude, zeroEndpoint})!.data;
                        expect(data.lowerMultiple).toBe(interval * place);
                        expect(data.number).toBe(interval * place + offset);
                        expect(data.lowerMultiple === 0).toBe(zeroEndpoint);
                        expect(all.has(data.number)).toBe(false);
                        all.add(data.number);
                    }
                }
            }
            expect(all.size).toBe((originalLast + 1) * (place - 1));
            expect(random).toHaveBeenCalledTimes(all.size * 2);
        }
    );

    it.each([[Scope.StepsOf10000, 10000], [Scope.StepsOf100000, 100000]] as const)(
        'retains every high-range endpoint and original tie behavior for %s', (roundingMagnitude, place) => {
            const random = vi.spyOn(rng, 'random');
            const originalLast = 1000000 / place - 1;
            const intervals = new Set<number>();
            for (const zeroEndpoint of [true, false]) {
                const first = zeroEndpoint ? 0 : 1;
                const last = zeroEndpoint ? 0 : originalLast;
                for (let interval = first; interval <= last; interval++) {
                    random.mockReturnValueOnce((interval - first + 0.5) / (last - first + 1)).mockReturnValueOnce(0.1);
                    const data = generator.generate({range: {min: 0, max: 1000000}, roundingMagnitude, zeroEndpoint})!.data;
                    expect(data.lowerMultiple).toBe(interval * place);
                    expect(data.number).toBe(data.midpoint);
                    expect(data.isMidpointTie).toBe(true);
                    intervals.add(interval);
                }
            }
            expect(intervals.size).toBe(originalLast + 1);
        }
    );

    it('completes direct requests with an unspecified magnitude using prior selected labels', () => {
        for (const range of [[], [Scope.NumbersSmaller1000], [Scope.NumbersSmaller1000000]]) {
            const selected = new Set<string>();
            for (let seed = 0; seed < 80; seed++) {
                rng.setSeed(seed);
                const resolved = extractConfig(IntegerRoundingGeneratorSchema, range);
                selected.add(resolved.config.roundingMagnitude!);
                expect(typeof resolved.config.zeroEndpoint).toBe('boolean');
                const stub = generator.generate(resolved.config);
                if (stub) {
                    expect(stub.data.lowerMultiple === 0).toBe(resolved.config.zeroEndpoint);
                    expect(resolved.resolvedLabels).toContain(resolved.config.zeroEndpoint
                        ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
                }
            }
            expect(selected).toEqual(new Set(roundingPlaces.map(([label]) => label)));
        }
    });

    it('emits truthful explicit zero/nonzero claims in both rounding branches', () => {
        for (const [magnitude, place] of roundingPlaces) for (const range of [Scope.NumbersSmaller1000,
            Scope.NumbersSmaller1000000]) for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            for (const seed of [0, 1, 17, 42]) {
                rng.setSeed(seed);
                const stub = generateWithLabels(generator, [range, magnitude, zero]);
                if (!stub) continue; // No valid mathematical support for the explicit combination.
                expect(stub.labels).toContain(zero);
                expect(stub.data.roundingPlace).toBe(place);
                expect(stub.data.lowerMultiple === 0).toBe(zero === Scope.NumbersWithZero);
            }
        }
    });
});
