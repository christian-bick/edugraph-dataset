import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {CountingClassifySortGenerator} from './generator.ts';
import {classificationRangeProfiles, classificationRows} from '../canonical-classification-domains.ts';

describe('CountingClassifySortGenerator', () => {
    const generator = new CountingClassifySortGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('rejects incomplete and unknown relation configuration', () => {
        expect(generator.type).toBe('counting');
        expect(() => generator.generate({})).toThrow('range');
        expect(() => generator.generate({range: classificationRangeProfiles[0]!.range})).toThrow('relation');
        expect(() => generator.generate({range: classificationRangeProfiles[0]!.range, relation: 'unknown'} as never)).toThrow('Unknown category-count relation');
    });
    it.each(['least', 'most', 'ascending', 'descending'] as const)('retains every feasible weighted allocation for %s', relation => {
        const draw = vi.spyOn(randomness, 'random');
        for (const {range} of classificationRangeProfiles) {
            const rows = classificationRows(range, relation), totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
            let offset = 0;
            for (const row of rows) {
                draw.mockClear().mockReturnValue((offset + row.weight / 2) / totalWeight);
                const data = generator.generate({range, relation})!.data;
                expect(Object.values(data.categories)).toEqual(row.counts);
                expect(data.numObjects).toBe(row.counts.reduce((sum, count) => sum + count, 0));
                expect(data.relation).toBe(relation);
                expect(data).not.toHaveProperty('answer');
                expect(data).not.toHaveProperty('items');
                const ascending = [...new Set(row.counts)].sort((a, b) => a - b);
                expect(data.ascendingGroups).toEqual(ascending.map(count => Object.keys(data.categories).filter(category => data.categories[category] === count)));
                expect(data.minimumCategories).toEqual(data.ascendingGroups[0]);
                expect(data.maximumCategories).toEqual(data.ascendingGroups.at(-1));
                if (relation === 'least') expect(data.minimumCategories).toHaveLength(1);
                if (relation === 'most') expect(data.maximumCategories).toHaveLength(1);
                expect(draw).toHaveBeenCalledTimes(1);
                offset += row.weight;
            }
        }
        expect(classificationRangeProfiles.flatMap(({range}) => classificationRows(range, relation))
            .some(row => new Set(row.counts).size === 2)).toBe(true);
    });
    it('replays with one draw, including category floors, and rejects impossible ranges without entropy', () => {
        for (const {range} of classificationRangeProfiles) {
            randomness.setSeed(42); randomness.random(); const continuation = randomness.getRandomState();
            randomness.setSeed(42); const first = generator.generate({range, relation: 'ascending'});
            expect(randomness.getRandomState()).toBe(continuation);
            randomness.setSeed(42); expect(generator.generate({range, relation: 'ascending'})).toEqual(first);
        }
        const draw = vi.spyOn(randomness, 'random');
        expect(generator.generate({range: {min: 0, max: 3} as never, relation: 'least'})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
