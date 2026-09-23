import {describe, expect, it} from 'vitest';
import {ShapeCircleDefinitionGenerator} from './generator.ts';

describe('circle definition', () => {
    it('has a curved closed boundary with no polygon vertices', () => {
        const data = new ShapeCircleDefinitionGenerator().generate({}).data;
        expect(data.definition).toEqual({closed: true, boundary: 'curved', sideCount: 0, vertexCount: 0});
        expect(data.target).toBe('circle');
    });
});
