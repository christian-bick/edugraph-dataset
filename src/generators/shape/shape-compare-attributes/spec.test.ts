import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeCompareAttributesGenerator} from './generator.ts';
import {comparisonShapes, ShapeCompareAttributesGeneratorSchema, spec} from './spec.ts';
import {comparisonRanges, comparisonTickets} from './numeric-domain.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';

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
            Area.NumericInequality,
            Scope.ShapeAttributes,
            label
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.shapes[0].shape).toBe(shape);
        expect(stub!.data.dimension).toBe(dimension);
        expect(stub!.labels).toContain(label);
    });

    it('resolves every feasible shape/band through direct configuration without inventing a lower claim', () => {
        for (const [shapeLabel, shape] of comparisonShapes) {
            for (const [index, range] of comparisonRanges.entries()) {
                const label = [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20][index]!;
                const resolved = ShapeCompareAttributesGeneratorSchema.range[1]([shapeLabel, label]);
                if (!comparisonTickets(shape, range).length) {
                    expect(resolved).toBeUndefined();
                    continue;
                }
                setSeed(52);
                const stub = generateWithLabels(new ShapeCompareAttributesGenerator(), [shapeLabel, label]);
                expect(stub!.labels).toContain(label);
                expect(hasCanonicalRangeWitness(stub!.data.shapes.map(item => item.count), range)).toBe(true);
            }
        }
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller20);
        expect(ShapeCompareAttributesGeneratorSchema.range[1]([Area.Cube, Scope.NumbersSmaller100])).toBeUndefined();
        expect(ShapeCompareAttributesGeneratorSchema.range[1]([Area.Cube, Scope.NumbersSmaller20, Scope.NumbersLarger5])).toBeUndefined();
    });
});
