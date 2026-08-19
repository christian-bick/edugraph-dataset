import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeCompareAttributesGenerator} from './generator.ts';

const CASES = [
    [Area.Triangle, 'triangle', '2d'],
    [Area.Square, 'square', '2d'],
    [Area.Rectangle, 'rectangle', '2d'],
    [Area.Hexagon, 'hexagon', '2d'],
    [Area.Circle, 'circle', '2d'],
    [Area.Cube, 'cube', '3d'],
    [Area.Cone, 'cone', '3d'],
    [Area.Cylinder, 'cylinder', '3d'],
    [Area.Sphere, 'sphere', '3d']
] as const;

describe('shape-compare-attributes generator spec', () => {
    it.each(CASES)('resolves %s to its exact comparison shape', (label, shape, dimension) => {
        setSeed(27);
        const stub = generateWithLabels(new ShapeCompareAttributesGenerator(), [
            Area.ShapeIdentity,
            Area.NumericComparison,
            Scope.ShapeAttributes,
            label
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.shapes[0].shape).toBe(shape);
        expect(stub!.data.dimension).toBe(dimension);
        expect(stub!.tags).toContain(label);
    });
});
