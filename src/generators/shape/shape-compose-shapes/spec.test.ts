import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeComposeShapesGenerator} from './generator.ts';
import {ShapeComposeShapesGeneratorSchema, spec} from './spec.ts';

describe('ShapeComposeShapesGenerator spec integration', () => {
    let generator: ShapeComposeShapesGenerator;

    beforeEach(() => {
        generator = new ShapeComposeShapesGenerator();
        setSeed(42);
    });

    it('declares composition generally and structure as mathematical configuration', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeSynthesis]);
        expect(Object.keys(ShapeComposeShapesGeneratorSchema)).toEqual([
            'classify',
            'compositionStructure'
        ]);
    });

    it('resolves single-level labels into a depth-one tree', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeSynthesis,
            Area.Rectangle,
            Scope.SingleLevelComposition
        ])!;

        expect(stub.data.compositionTree.shape).toBe('rectangle');
        expect(stub.data.compositionDepth).toBe(1);
        expect(stub.labels).toEqual(expect.arrayContaining([
            Area.Rectangle,
            Scope.SingleLevelComposition
        ]));
        expect(stub.labels).not.toContain(Area.Triangle);
    });

    it('resolves multi-level labels into a depth-two tree', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeSynthesis,
            Area.Hexagon,
            Scope.MultiLevelComposition
        ])!;

        expect(stub.data.compositionTree.shape).toBe('hexagon');
        expect(stub.data.compositionTree.inputs.map(input => input.shape))
            .toEqual(['trapezoid', 'trapezoid']);
        expect(stub.data.compositionDepth).toBe(2);
        expect(stub.labels).toEqual(expect.arrayContaining([
            Area.Hexagon,
            Scope.MultiLevelComposition
        ]));
        expect(stub.labels).not.toContain(Area.Trapezoid);
        expect(stub.labels).not.toContain(Area.Triangle);
    });
});
