import {describe, expect, it} from 'vitest';
import {buildShapeClassificationPresentation} from './classification-presentation.ts';

describe('shape classification presentation', () => {
    it('expands category counts deterministically without generator-owned item order', () => {
        const categories = {A: 2, B: 3, C: 1};
        const first = buildShapeClassificationPresentation(categories, 41);
        const second = buildShapeClassificationPresentation(categories, 41);

        expect(second).toEqual(first);
        expect(first.items).toHaveLength(6);
        expect(first.mappedCategories).toEqual({A: 'circle', B: 'square', C: 'triangle'});
        expect(first.items.filter(item => item.shape === 'circle')).toHaveLength(2);
        expect(first.items.filter(item => item.shape === 'square')).toHaveLength(3);
        expect(first.items.filter(item => item.shape === 'triangle')).toHaveLength(1);
        expect(buildShapeClassificationPresentation(categories, 42).items).not.toEqual(first.items);
    });
});
