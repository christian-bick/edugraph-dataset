import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {CountingClassifySortGenerator} from './generator.ts';
import {CountingClassifySortGeneratorConfig} from './spec.ts';

const relations = ['least', 'most', 'ascending', 'descending'] as const;

describe('CountingClassifySortGenerator', () => {
    const generator = new CountingClassifySortGenerator();
    beforeEach(() => setSeed(42));

    it('has the counting type and rejects incomplete configuration', () => {
        expect(generator.type).toBe('counting');
        expect(() => generator.generate({})).toThrow('range');
        expect(() => generator.generate({range: {min: 1, max: 10}})).toThrow('relation');
        expect(() => generator.generate({range: {min: 1, max: 10}, relation: 'unknown'} as unknown as CountingClassifySortGeneratorConfig))
            .toThrow('Unknown category-count relation');
    });

    it.each([
        {min: 1, max: 2}, {min: 8, max: 4}, {min: 1, max: 3},
        {min: 5, max: 14}, {min: 5, max: 15}, {min: 10, max: 20},
        {min: NaN, max: 10}, {min: Infinity, max: 10}, {min: 1, max: Infinity}, {min: 1, max: 4.5}
    ])('returns null when the range cannot produce a valid instance: %j', range => {
        for (const relation of relations) expect(generator.generate({range, relation})).toBeNull();
    });

    it.each(relations)('preserves every mathematical witness for %s', relation => {
        const samples: CountingClassifySortProblem[] = [];
        for (let seed = 1; seed <= 100; seed++) {
            setSeed(seed);
            const result = generator.generate({range: {min: 1, max: 10}, relation});
            if (!result) continue;
            const data = result.data;
            samples.push(data);
            expect(data.relation).toBe(relation);
            expect(data).not.toHaveProperty('answer');
            expect(data).not.toHaveProperty('items');
            expect(data.numObjects).toBeGreaterThanOrEqual(3);
            expect(data.numObjects).toBeLessThanOrEqual(10);
            expect(Object.values(data.categories).reduce((sum, count) => sum + count, 0)).toBe(data.numObjects);
            expect(data.ascendingGroups.flat().sort()).toEqual(['A', 'B', 'C']);
            expect(data.ascendingGroups.length).toBeGreaterThan(1);
            data.ascendingGroups.forEach((group, index) => {
                const count = data.categories[group[0]!]!;
                expect(count).toBeGreaterThan(0);
                expect(group.every(category => data.categories[category] === count)).toBe(true);
                if (index > 0) expect(count).toBeGreaterThan(data.categories[data.ascendingGroups[index - 1]![0]!]!);
            });
            expect(data.minimumCategories).toEqual(data.ascendingGroups[0]);
            expect(data.maximumCategories).toEqual(data.ascendingGroups.at(-1));
            if (relation === 'least') expect(data.minimumCategories).toHaveLength(1);
            if (relation === 'most') expect(data.maximumCategories).toHaveLength(1);
        }
        expect(samples.length).toBeGreaterThan(0);
        if (relation === 'least') expect(samples.some(data => data.maximumCategories.length === 2)).toBe(true);
        if (relation === 'most') expect(samples.some(data => data.minimumCategories.length === 2)).toBe(true);
        if (relation === 'ascending' || relation === 'descending') {
            expect(samples.some(data => data.minimumCategories.length === 2)).toBe(true);
            expect(samples.some(data => data.maximumCategories.length === 2)).toBe(true);
        }
    });

    it('uses the integer lower bound and repeats exactly for the same seed', () => {
        const config = {range: {min: 2.2, max: 20}, relation: 'ascending'} as const;
        let checked = 0;
        for (let seed = 1; seed <= 20; seed++) {
            setSeed(seed);
            const first = generator.generate(config);
            setSeed(seed);
            expect(generator.generate(config)).toEqual(first);
            if (first) {
                expect(first.data.numObjects).toBeGreaterThanOrEqual(9);
                expect(Object.values(first.data.categories).every(count => count >= 3)).toBe(true);
                checked++;
            }
        }
        expect(checked).toBeGreaterThan(0);
    });

    it.each(relations)('respects the lower bound in each category and the total for %s', relation => {
        let checked = 0;
        for (let seed = 1; seed <= 100; seed++) {
            setSeed(seed);
            const result = generator.generate({range: {min: 5, max: 20}, relation});
            if (!result) continue;
            checked++;
            for (const count of [...Object.values(result.data.categories), result.data.numObjects]) {
                expect(Number.isSafeInteger(count)).toBe(true);
                expect(count).toBeGreaterThanOrEqual(5);
                expect(count).toBeLessThanOrEqual(20);
            }
        }
        expect(checked).toBeGreaterThan(0);
    });
});
