import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeEdgeCompositionGenerator} from './generator.ts';

describe('ShapeEdgeCompositionGenerator', () => {
    const generator = new ShapeEdgeCompositionGenerator();

    it.each([
        ['triangle', 3], ['square', 4], ['rectangle', 4], ['hexagon', 6]
    ] as const)('provides the edges and vertices of a closed %s', (shape, count) => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            expect(generator.generate({shape})).toEqual({data: {target: shape, sides: count, corners: count}});
        }
    });

    it.each([{}, {shape: ''}, {shape: 'circle'}, {shape: 'cube'}, {shape: 'toString'}])(
        'rejects missing or unsupported polygons: %j', config => {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    );
});
