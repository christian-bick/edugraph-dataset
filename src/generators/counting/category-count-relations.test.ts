import {describe, expect, it} from 'vitest';
import {buildCategoryCountRelations} from './category-count-relations.ts';

describe('canonical category-count relations', () => {
    it('orders every category and computes both endpoints independently of input order', () => {
        expect(buildCategoryCountRelations({C: 2, A: 3, B: 1})).toEqual({
            ascendingGroups: [['B'], ['C'], ['A']], minimumCategories: ['B'], maximumCategories: ['A']
        });
    });

    it.each([
        [{A: 1, B: 1, C: 3}, [['A', 'B'], ['C']], ['A', 'B'], ['C']],
        [{A: 3, B: 1, C: 3}, [['B'], ['A', 'C']], ['B'], ['A', 'C']],
        [{A: 2, B: 2, C: 2}, [['A', 'B', 'C']], ['A', 'B', 'C'], ['A', 'B', 'C']]
    ])('preserves tied endpoints for %j', (categories, ascendingGroups, minimumCategories, maximumCategories) => {
        expect(buildCategoryCountRelations(categories as Record<string, number>)).toEqual({
            ascendingGroups, minimumCategories, maximumCategories
        });
    });

    it('uses category identity only to stabilize members within a tied group', () => {
        expect(buildCategoryCountRelations({C: 1, B: 1, A: 1}).ascendingGroups).toEqual([['A', 'B', 'C']]);
    });

    it.each([{}, {A: 0}, {A: -1}, {A: 1.5}, {A: NaN}, {A: Infinity}])('rejects invalid counts %j', categories => {
        expect(() => buildCategoryCountRelations(categories as Record<string, number>)).toThrow('positive integers');
    });
});
