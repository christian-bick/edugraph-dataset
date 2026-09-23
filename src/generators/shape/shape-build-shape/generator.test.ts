import {describe, expect, it} from 'vitest';
import {ShapeBuildShapeGenerator} from './generator.ts';

describe('polygon definitions', () => {
    const generator = new ShapeBuildShapeGenerator();
    it.each([['triangle', 3], ['square', 4], ['rectangle', 4], ['quadrilateral', 4], ['pentagon', 5], ['hexagon', 6]] as const)(
        'preserves the mathematical definition of %s', (shape, count) => {
            const data = generator.generate({shape}).data;
            expect(data.definition).toMatchObject({closed: true, boundary: 'straight', sideCount: count, vertexCount: count});
            expect(data.target).toBe(shape);
        }
    );
    it('rejects missing or out-of-family configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({shape: 'circle'} as never)).toThrow('supported polygon');
    });
});
