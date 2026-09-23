import {describe, expect, it} from 'vitest';
import {ShapeExcludedQuadrilateralGenerator} from './generator.ts';

describe('quadrilateral exclusion relation', () => {
    it('provides the witnesses excluding all three named subcategories', () => {
        const data = new ShapeExcludedQuadrilateralGenerator().generate({}).data;
        expect(data.definition).toMatchObject({sideCount: 4, vertexCount: 4, equalSides: false, rightAngleCount: 0});
        expect(data.excludedCategories).toEqual(['rhombus', 'rectangle', 'square']);
    });
});
