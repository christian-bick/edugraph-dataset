import {describe, expect, it} from 'vitest';
import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {
    categoryGroupsInDirection, generateScatteredPositions, validateCategoryCountData
} from './category-count-helpers.ts';

const data: CountingClassifySortProblem = {
    categories: {A: 3, B: 1, C: 2}, numObjects: 6, relation: 'ascending',
    ascendingGroups: [['B'], ['C'], ['A']], minimumCategories: ['B'], maximumCategories: ['A']
};

describe('category-count projection helpers', () => {
    it('validates the complete mathematical witness and only reverses supplied groups', () => {
        expect(() => validateCategoryCountData('example', data)).not.toThrow();
        expect(categoryGroupsInDirection(data)).toEqual([['B'], ['C'], ['A']]);
        expect(categoryGroupsInDirection({...data, relation: 'descending'})).toEqual([['A'], ['C'], ['B']]);
        expect(data.ascendingGroups).toEqual([['B'], ['C'], ['A']]);
    });

    it('accepts all-equal ordering but rejects a supposedly unique tied endpoint', () => {
        const tied: CountingClassifySortProblem = {
            categories: {A: 2, B: 2, C: 2}, numObjects: 6, relation: 'ascending',
            ascendingGroups: [['A', 'B', 'C']], minimumCategories: ['A', 'B', 'C'], maximumCategories: ['A', 'B', 'C']
        };
        expect(() => validateCategoryCountData('example', tied)).not.toThrow();
        for (const relation of ['least', 'most'] as const) {
            expect(() => validateCategoryCountData('example', {...tied, relation})).toThrow('must agree');
        }
    });

    it.each([
        {numObjects: 5}, {categories: {A: 3, B: 1}}, {categories: {A: 0, B: 1, C: 5}},
        {ascendingGroups: [['B'], [], ['A']]}, {ascendingGroups: [['B'], ['C'], ['C']]},
        {ascendingGroups: [['B'], ['C'], ['D']]}, {ascendingGroups: [['B', 'C'], ['A']]},
        {ascendingGroups: [['A'], ['C'], ['B']]}, {minimumCategories: ['A']},
        {maximumCategories: ['B']}, {maximumCategories: ['A', 'A']}, {relation: 'unknown'}
    ])('rejects inconsistent payload fields %j', change => {
        expect(() => validateCategoryCountData('example', {...data, ...change} as CountingClassifySortProblem)).toThrow();
    });

    it('rejects absent required evidence', () => {
        expect(() => validateCategoryCountData('example', {categories: data.categories} as CountingClassifySortProblem))
            .toThrow('numObjects');
    });

    it('places every object inside the frame deterministically', () => {
        const layout = generateScatteredPositions(20, 450, 200, 32);
        expect(generateScatteredPositions(20, 450, 200, 32)).toEqual(layout);
        expect(layout.positions).toHaveLength(20);
        expect(layout.itemSize).toBeGreaterThan(0);
        for (const position of layout.positions) {
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.x + layout.itemSize).toBeLessThanOrEqual(450);
            expect(position.y + layout.itemSize).toBeLessThanOrEqual(200);
        }
    });
});
