import {afterEach, describe, expect, it, vi} from 'vitest';
import {CountingClassifyCountGenerator} from './generator.ts';
import * as randomness from '../../../lib/random.ts';
import {classificationRangeProfiles, classificationRows} from '../canonical-classification-domains.ts';

describe('CountingClassifyCountGenerator', () => {
    const generator = new CountingClassifyCountGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('requires range configuration and preserves the counting payload contract', () => {
        expect(generator.type).toBe('counting');
        expect(() => generator.generate({})).toThrow('range');
    });
    it('generates every allocation from its exact conditional weight interval', () => {
        const draw = vi.spyOn(randomness, 'random');
        let checked = 0;
        for (const {range} of classificationRangeProfiles) {
            const rows = classificationRows(range), totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
            let offset = 0;
            for (const row of rows) {
                draw.mockClear().mockReturnValue((offset + row.weight / 2) / totalWeight);
                const data = generator.generate({range})!.data;
                expect(Object.values(data.categories)).toEqual(row.counts);
                expect(Object.keys(data.categories)).toEqual(['A', 'B', 'C'].slice(0, row.counts.length));
                expect(data.numObjects).toBe(row.counts.reduce((sum, count) => sum + count, 0));
                expect(data).not.toHaveProperty('items');
                expect(draw).toHaveBeenCalledTimes(1);
                offset += row.weight; checked++;
            }
        }
        expect(checked).toBe(1141);
    });
    it('is deterministic with one allocation draw and rejects noncanonical ranges before randomness', () => {
        const config = {range: classificationRangeProfiles[1]!.range};
        randomness.setSeed(42); randomness.random(); const continuation = randomness.getRandomState();
        randomness.setSeed(42); const first = generator.generate(config);
        expect(randomness.getRandomState()).toBe(continuation);
        randomness.setSeed(42); expect(generator.generate(config)).toEqual(first);
        const draw = vi.spyOn(randomness, 'random');
        expect(generator.generate({range: {min: 0, max: 0} as never})).toBeNull();
        expect(generator.generate({range: {...config.range, minimumBelow: 100}})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
