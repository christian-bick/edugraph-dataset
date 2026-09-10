import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeEdgeCompositionGenerator} from './generator.ts';
import {ShapeEdgeCompositionGeneratorSchema} from './spec.ts';

describe('edge-composition schema', () => {
    it.each([
        [Area.Triangle, 'triangle', 3], [Area.Square, 'square', 4],
        [Area.Rectangle, 'rectangle', 4], [Area.Hexagon, 'hexagon', 6]
    ] as const)('resolves %s into a typed polygon', (label, target, count) => {
        const result = generateWithLabels(new ShapeEdgeCompositionGenerator(), [label])!;
        expect(result.data).toEqual({target, sides: count, corners: count});
        expect(result.labels).toContain(label);
    });

    it('rejects competing shapes rather than choosing one by declaration order', () => {
        expect(() => extractConfig(ShapeEdgeCompositionGeneratorSchema, [Area.Triangle, Area.Hexagon])).toThrow();
    });
});
