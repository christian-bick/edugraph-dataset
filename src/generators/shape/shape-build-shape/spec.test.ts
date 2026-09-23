import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeBuildShapeGenerator} from './generator.ts';

describe('polygon definition schema', () => {
    it.each([[Area.Triangle, 'triangle'], [Area.Square, 'square'], [Area.Rectangle, 'rectangle'],
        [Area.Quadrilateral, 'quadrilateral'], [Area.Pentagon, 'pentagon'], [Area.Hexagon, 'hexagon']] as const)(
        'resolves the exact %s shape', (label, shape) => {
            const result = generateWithLabels(new ShapeBuildShapeGenerator(), [label])!;
            expect(result.data.target).toBe(shape);
            expect(result.labels).toEqual([label]);
        }
    );
});
