import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {MultiplicativeComparisonGenerator} from './generator.ts';
import {MultiplicativeComparisonGeneratorSchema as schema} from './spec.ts';
import {comparisonDomain, comparisonQuantities} from './domain.ts';

afterEach(() => vi.restoreAllMocks());

describe('MultiplicativeComparisonGenerator', () => {
    const generator = new MultiplicativeComparisonGenerator();

    it('preserves every original factor pair exactly once per operation across 11 feasible profiles', () => {
        const random = vi.spyOn(rng, 'random');
        const covered = {multiplication: new Set<string>(), division: new Set<string>()};
        expect(schema.profile[2]).toHaveLength(11);
        for (const labels of schema.profile[2]) {
            const config = extractConfig(schema, [...labels]).config;
            const profile = config.profile!;
            const candidates = comparisonDomain(profile);
            const rows = [...new Set(candidates.map(data => data.scaleFactor))].map(scale => ({scale,
                values: candidates.filter(data => data.scaleFactor === scale)
            }));
            const weights = rows.map(row => row.values.length / (Math.min(12, Math.floor(100 / row.scale)) - 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let cumulativeWeight = 0;
            for (const [rowIndex, row] of rows.entries()) {
                for (const [index, expected] of row.values.entries()) {
                    random.mockReset().mockReturnValueOnce((cumulativeWeight + weights[rowIndex]! / 2) / totalWeight)
                        .mockReturnValueOnce((index + 0.5) / row.values.length);
                    const {data} = generator.generate(config);
                    expect(random).toHaveBeenCalledTimes(2);
                    expect(data).toEqual(expected);
                    expect(data.comparedQuantity).toBe(data.referenceQuantity * data.scaleFactor);
                    expect(hasCanonicalRangeWitness(comparisonQuantities(data), profile.range)).toBe(true);
                    if (data.operation === 'division') {
                        expect(data.comparedQuantity < 10).toBe(profile.operation === 'division-single');
                    }
                    const key = `${data.scaleFactor}:${data.referenceQuantity}`;
                    expect(covered[data.operation].has(key)).toBe(false);
                    covered[data.operation].add(key);
                }
                cumulativeWeight += weights[rowIndex]!;
            }
        }
        const oldPairs = new Set<string>();
        for (let scale = 2; scale <= 9; scale++) {
            for (let reference = 2; reference <= Math.min(12, Math.floor(100 / scale)); reference++) {
                oldPairs.add(`${scale}:${reference}`);
            }
        }
        expect(oldPairs.size).toBe(87);
        expect(covered.multiplication).toEqual(oldPairs);
        expect(covered.division).toEqual(oldPairs);
    });

    it('strictly rejects malformed or impossible profiles before consuming randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, {profile: {}},
            {profile: {operation: 'addition', range: createCanonicalNumericRange(20)}},
            {profile: {operation: 'multiplication', range: createCanonicalNumericRange(1000)}},
            {profile: {operation: 'multiplication', range: {min: 0, max: 20}}},
            {profile: {operation: 'multiplication', range: {min: 20, max: 10}}},
            {profile: {operation: 'division-single', range: createCanonicalNumericRange(100)}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('is deterministic and does not let generated-object mutation affect future draws', () => {
        const config = extractConfig(schema, [...schema.profile[2][0]!]).config;
        rng.setSeed('multiplicative-comparison-seed');
        const first = generator.generate(config);
        const expected = {...first.data};
        const continuation = rng.getRandomState();
        first.data.referenceQuantity = 999;
        rng.setSeed('multiplicative-comparison-seed');
        expect(generator.generate(config).data).toEqual(expected);
        expect(rng.getRandomState()).toEqual(continuation);
    });
});
