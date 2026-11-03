import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {unitSharingPairs, unitSharingProfileValues} from '../fraction-unit-sharing-domain.ts';
import {FractionUnitSharingRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('fraction-unit-sharing-relations native mathematics', () => {
    it('preserves every original ordered pair, material and optional witness across canonical bands', () => {
        const generator = new FractionUnitSharingRelationsGenerator();
        const mock = vi.spyOn(rng, 'random');
        for (const relationProfile of unitSharingProfileValues) {
            const seen = new Set<string>();
            for (const upper of [5,10]) {
                const range = createCanonicalNumericRange(upper);
                const pairs = unitSharingPairs('sharing', range);
                for (const [index, [b, n]] of pairs.entries()) for (const material of [0.25, 0.75]) {
                    mock.mockReturnValueOnce((index + 0.5) / pairs.length).mockReturnValueOnce(material);
                    const stub = generator.generate({relationProfile, range});
                    const data = stub.data;
                    expect(Object.keys(stub)).toEqual(['data']);
                    expect(data.kind).toBe('fraction-unit-sharing');
                    expect(data.dividend).toEqual({numerator: 1, denominator: b});
                    expect(data.divisor).toEqual({numerator: n, denominator: 1});
                    expect(data.quotient).toEqual({numerator: 1, denominator: b * n});
                    expect(data.inverse).toEqual({quotientFactor: data.quotient, divisorFactor: data.divisor, reconstructedDividend: data.dividend});
                    expect(data.story).toEqual({material: material < 0.5 ? 'ribbon' : 'rope', measureUnit: 'meter', recipientUnit: 'person'});
                    expect(data.equationWitness !== undefined).toBe(relationProfile === 'unit-dividend-equation');
                    expect(data.multiplicationWitness !== undefined).toBe(relationProfile === 'unit-dividend-inverse');
                    if (data.equationWitness) expect(data.equationWitness).toEqual({totalMeasure: data.dividend, groupCount: data.divisor, measurePerGroup: data.quotient});
                    if (data.multiplicationWitness) expect(data.multiplicationWitness).toEqual({unreducedProduct: {numerator: n, denominator: b * n}, reconstructedDividend: data.dividend});
                    expect(data.recipientCount).toBe(n);
                    for (const key of ['model', 'wholePartitionCount', 'refinedPartitionCount']) expect(Object.hasOwn(data, key)).toBe(false);
                    const maximum = n;
                    expect(maximum).toBeGreaterThan(range.maximumAbove);
                    expect(maximum).toBeLessThanOrEqual(range.max);
                    expect(1 / (b * n)).toBeLessThan(5);
                    const key = b + ':' + n + ':' + material;
                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                }
            }
            expect(seen.size).toBe(50);
        }
    });

    it('replays exactly and rejects incomplete, impossible or weakened configurations', () => {
        const generator = new FractionUnitSharingRelationsGenerator();
        const config = {relationProfile: 'unit-dividend-basic', range: createCanonicalNumericRange(5)} as const;
        rng.setSeed(41); const expected = generator.generate(config);
        rng.setSeed(41); expect(generator.generate(config)).toEqual(expected);
        for (const value of [null, undefined, {}, {relationProfile: config.relationProfile}, {range: config.range},
            {...config, relationProfile: 'other'}, {...config, range: createCanonicalNumericRange(1000)},
            {...config, range: createCanonicalNumericRange(10, 5)}, {...config, range: {...config.range, maximumAbove: 0}}]) {
            expect(() => generator.generate(value as never)).toThrow();
        }
    });
});
